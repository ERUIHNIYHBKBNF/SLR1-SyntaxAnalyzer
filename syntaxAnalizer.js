function unionSet(set1, set2) {
  const newSet = new Set(set1);
  set2.forEach(s => newSet.add(s));
  return newSet;
}

function unionSetWithoutEpsilonInSet2(set1, set2) {
  const newSet = new Set(set2);
  newSet.delete('ε');
  return unionSet(set1, newSet);
}

function getFirst(G) {
  const FIRST = {};
  // Initialize FIRST
  G.T.forEach(t => FIRST[t] = new Set([t]));
  G.V.forEach(v => FIRST[v] = new Set());
  G.P.forEach(p => {
    if (G.T.includes(p.r[0])) {
      FIRST[p.l].add(p.r[0]);
    }
    if (p.r[0] === 'ε') {
      FIRST[p.l].add('ε');
    }
  });
  // repeat until no change
  let changed = true;
  while (changed) {
    changed = false;
    G.P.forEach(p => {
      // 包含右部第一个变量的FIRST集
      if (G.V.includes(p.r[0])) {
        const oldSize = FIRST[p.l].size;
        FIRST[p.l] = unionSetWithoutEpsilonInSet2(FIRST[p.l], FIRST[p.r[0]]);
        if (FIRST[p.l].size !== oldSize) {
          changed = true;
        }
      }
      // 包含右部第一个不能推为空的变量（及其之前变量）的FIRST集
      let index = 0;
      while (index < p.r.length - 1 && G.V.includes(p.r[index]) && FIRST[p.r[index]].has('ε')) index++;
      for (let k = 1; k <= index; k++) {
        const oldSize = FIRST[p.l].size;
        FIRST[p.l] = unionSetWithoutEpsilonInSet2(FIRST[p.l], FIRST[p.r[k]]);
        if (FIRST[p.l].size !== oldSize) {
          changed = true;
        }
      }
      if (index === p.r.length - 1 && G.V.includes(p.r[index]) && FIRST[p.r[index]].has('ε')) {
        const oldSize = FIRST[p.l].size;
        FIRST[p.l].add('ε');
        if (FIRST[p.l].size !== oldSize) {
          changed = true;
        }
      }
    });
  }
  return FIRST;
}

function getFirstOfSentence(G, FIRST, str) {
  const first = new Set(unionSetWithoutEpsilonInSet2(new Set(), FIRST[str[0]]));
  let k = 0;
  while (k < str.length - 1 && G.V.includes(str[k]) && FIRST[str[k]].has('ε')) {
    first = unionSetWithoutEpsilonInSet2(first, FIRST[str[k + 1]]);
    k++;
  }
  if (k === str.length - 1 && G.V.includes(str[k]) && FIRST[str[k]].has('ε')) {
    first.add('ε');
  }
  return first;
}

function getFollow(G, FIRST) {
  // initialize FOLLOW
  const FOLLOW = {};
  G.V.forEach(v => FOLLOW[v] = new Set());
  FOLLOW[G.S].add('#'); // add end symbol
  // repeat until no change
  let changed = true;
  while (changed) {
    changed = false;
    G.P.forEach(p => {
      for (let i = 0; i < p.r.length; i++) {
        if (G.V.includes(p.r[i])) {
          const oldSize = FOLLOW[p.r[i]].size;
          // has ε following
          if (i === p.r.length - 1) {
            FOLLOW[p.r[i]] = unionSet(FOLLOW[p.r[i]], FOLLOW[p.l]);
          } else {
            FOLLOW[p.r[i]] = unionSetWithoutEpsilonInSet2(
                              FOLLOW[p.r[i]],
                              getFirstOfSentence(G, FIRST, p.r.slice(i + 1)));
          }
          if (FOLLOW[p.r[i]].size !== oldSize) {
            changed = true;
          }
        }
      }
    });
  }
  return FOLLOW;
}

// is two I has samme items
function isEqualI(I1, I2) {
  if (I1.items.size !== I2.items.size) return false;
  let equal = true;
  I1.items.forEach(item1 => {
    if (!I2.items.find(item2 => isEqualItem(item1, item2))) {
      equal = false;
    }
  });
  return equal;
}

// is two productions are same
function isEqualRight(arr1, arr2) {
  if (arr1.length !== arr2.length) return false;
  for (let i = 0; i < arr1.length; i++) {
    if (arr1[i] !== arr2[i]) return false;
  }
  return true;
}

// is two items are same
function isEqualItem(item1, item2) {
  return item1.l === item2.l && item1.p === item2.p && isEqualRight(item1.r, item2.r);
}

class Item {
  /**
   * l, r and pointer means the current progress of the item
   * @param {v} l 
   * @param {Array<V, T>} r 
   * @param {number} p 
   */
  constructor(l, r, p) {
    this.l = l;
    this.r = r;
    this.p = p;
  }
}

// a set of LR0Item(a vertex in LR(0) DFA)
class I {
  /**
   * @param {Array<Item>} items 
   */
  constructor(items) {
    this.items = items;
    this.index = -1;
    this.GO = {
      // v/t: I
    };
  }
  calculateCLOSURE(G) {
    const CLOSURE = [...this.items];
    let changed = true;
    while (changed) {
      changed = false;
      CLOSURE.forEach(item => {
        let left;
        if (item.p < item.r.length && G.V.includes(left = item.r[item.p])) {
          G.P.forEach(p => {
            if (p.l === left) {
              const newItem = new Item(p.l, p.r, 0);
              if (!CLOSURE.find(i => isEqualItem(i, newItem))) {
                CLOSURE.push(newItem);
                changed = true;
              }
            }
          });
        }
      });
    }
    this.items = CLOSURE;
  }
  calculateGo(v) {
    const newItems = [];
    this.items.forEach(item => {
      if (item.p < item.r.length && item.r[item.p] === v) {
        newItems.push(new Item(item.l, item.r, item.p + 1));
      }
    });
    return new I(newItems);
  }
}

function getLR0DFA(G) {
  const VnT = G.V.concat(G.T); // all posiable edges
  // initialize I0
  const I0 = new I(new Set([new Item(G.S, G.P[0].r, 0)]));
  I0.index = 0;
  // DFA are vertices in LR(0) DFA
  const DFA = [I0];

  // calculate full DFA
  let DFAIndex = 0;
  while (DFAIndex < DFA.length) {
    const Ii = DFA[DFAIndex];
    Ii.calculateCLOSURE(G);
    // for each vertex, calculate all possible edges
    VnT.forEach(v => {
      const GO = Ii.calculateGo(v);
      if (GO.items.size === 0) {
        return;
      }
      let same = false;
      for (let i = 0; i < DFA.length; i++) {
        if (isEqualI(GO, DFA[i])) {
          same = DFA[i];
          break;
        }
      }
      if (same) {
        Ii.GO[v] = same;
      } else {
        GO.index = DFA.length;
        Ii.GO[v] = GO;
        DFA.push(GO);
      }
    });
    DFAIndex++;
  }
  return DFA;
}

function getSLR1Table(G, FOLLOW) {
  // make extensive grammar
  G.P.unshift(new Product(G.S + "'", [G.S]));
  G.S = G.S + "'";
  G.V.unshift(G.S);

  // initialize LR0 DFA
  const DFA = getLR0DFA(G);
  
  // initialize SLR1 table
  const ACTION = {};
  G.T.forEach(t => ACTION[t] = new Array(DFA.length).fill({
    type: '',
  }));
  ACTION['#'] = new Array(DFA.length).fill({
    type: '',
  });
  const GOTO = {};
  G.V.forEach(v => GOTO[v] = new Array(DFA.length).fill(''));

  // calculate SLR1 table
  DFA.forEach(I => {
    I.items.forEach(item => {
      // need to reduce
      if (item.p === item.r.length) {
        if (item.l === G.S) {
          // TODO: check if there is a conflict
          ACTION['#'][I.index] = {
            type: 'accept',
          };
        } else {
          const left = item.l;
          G.P.forEach((p, index) => {
            if (p.l === left && isEqualRight(p.r, item.r)) {
              FOLLOW[left].forEach(t => {
                ACTION[t][I.index] = {
                  type: 'reduce',
                  index,
                  p,
                };
              });
            }
          });
        }
      } else { // need to shift
        const v = item.r[item.p];
        if (G.V.includes(v)) {
          GOTO[v][I.index] = I.GO[v].index;
        } else {
          ACTION[v][I.index] = {
            type: 'shift',
            index: I.GO[v].index,
          };
        }
      }
    });
  });
  // console.table(ACTIONSHOW);
  // console.table(GOTO);
  return [ACTION, GOTO];
}

function syntaxAnalysis(tokens, ACTION, GOTO) {
  let html = '';
  const statusStack = [0];
  const symbolStack = ['#'];
  tokens.push({
    type: '#',
    value: '#',
  });
  let tokenIndex = 0, step = 1;
  while (true) {
    if (tokenIndex > tokens.length) {
      break;
    }
    html += `<div class="text-violet-600">Step ${step++}:</div>`;
    html +=  `
      <p>Status: ${statusStack.map(s => ` <span class="text-gray-500"> ${s} </span> `).join(' ')}</p>
    `;
    html +=  `
      <p>Symbol: ${symbolStack.map(s => ` <span class="text-gray-500"> ${s} </span> `).join(' ')}</p>
    `;
    html +=  `
      <p>Input: ${tokens.slice(tokenIndex).map(t => ` <span class="text-gray-500"> ${
        (t.type === 'literal' || t.type === 'identifier') ? t.type : t.value
      } </span> `).join(' ')}</p>
    `;
    const status = statusStack[statusStack.length - 1];
    let token = tokens[tokenIndex];
    if (token.type === 'literal' || token.type === 'identifier') {
      token = token.type;
    } else {
      token = token.value;
    }
    const action = ACTION[token][status];
    // console.log(`Step${step - 1}`, token, status, action, statusStack);
    if (action.type === '') {
      alert('Syntax error!');
      html = '';
      break;
    }
    if (action.type === 'accept') {
      alert('Syntax Analized!');
      html += `<div class="text-green-600">Accept!</div>`;
      break;
    }
    if (action.type === 'shift') {
      html += `<div>
        <span class="text-blue-400">Shift: </span>
        <span class="text-gray-500">[</span>
        <span class="text-gray-700">${status}</span>
        <span class="text-gray-500">, </span>
        <span class="text-gray-700">${token}</span>
        <span class="text-gray-500">]</span>
      </div>`;
      statusStack.push(action.index);
      symbolStack.push(token);
      tokenIndex++;
    }
    if (action.type === 'reduce') {
      html += `<div>
        <span class="text-emerald-500">Reduce with: </span>
        <span class="text-blue-500">${action.index}:</span>
        <span class="text-gray-700">${action.p.l}</span>
        <span class="text-gray-500">-></span>
        <span class="text-gray-700">${action.p.r.join(' ')}</span>
      </div>`;
      const p = action.p;
      for (let i = 0; i < p.r.length; i++) {
        // if (symbolStack.pop() !== p.r[p.r.length - 1 - i]) {
        //   alert('Syntax error!');
        //   break;
        // }
        statusStack.pop();
        symbolStack.pop();
      }
      statusStack.push(GOTO[p.l][statusStack[statusStack.length - 1]]);
      symbolStack.push(p.l);
    }
  }
  document.getElementById('syntaxAnalysis').innerHTML = html;
}