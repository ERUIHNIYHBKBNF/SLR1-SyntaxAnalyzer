class Product {
  constructor(l, r) {
    this.l = l;
    this.r = r;
  }
}

const G = {
  S: 'Program',
  V: ['Program', 'FunctionDeclaration', 'ArgumentList', 'BlockStatement',
    'Type', 'ArithmeticExpression', 'BoolExpression',
    'ArithmeticOperator', 'ComparisonOperator',
  ],
  T: ['identifier', 'literal', '(', ')', '{', '}', ',', ';', '=',
    'while', 'if', 'else', 'return', 'int', 'float', 'double', 'bool', 'char',
    '&&', '||', '!', 'true', 'false', '<', '>', '<=', '>=', '==', '!=',
    '-', '+', '*', '/'
  ],
  P: [
    new Product('Program', ['FunctionDeclaration']),

    new Product('FunctionDeclaration', ['FunctionDeclaration', 'FunctionDeclaration']),
    new Product('FunctionDeclaration', ['Type', 'identifier', '(', ')', '{', 'BlockStatement', '}']),
    new Product('FunctionDeclaration', ['Type', 'identifier', '(', 'ArgumentList', ')', '{', 'BlockStatement', '}']),
    new Product('ArgumentList', ['Type', 'identifier']),
    new Product('ArgumentList', ['Type', 'identifier', ',', 'ArgumentList']),

    new Product('BlockStatement', ['BlockStatement', 'BlockStatement']),
    new Product('BlockStatement', ['Type', 'identifier', ';']),
    new Product('BlockStatement', ['Type', 'identifier', '=', 'ArithmeticExpression', ';']),
    new Product('BlockStatement', ['identifier', '=', 'ArithmeticExpression', ';']),
    new Product('BlockStatement', ['while', '(', 'BoolExpression', ')', '{', 'BlockStatement', '}']),
    new Product('BlockStatement', ['if', '(', 'BoolExpression', ')', '{', 'BlockStatement', '}']),
    new Product('BlockStatement', ['if', '(', 'BoolExpression', ')', '{', 'BlockStatement', '}', 'else', '{', 'BlockStatement', '}']),
    new Product('BlockStatement', ['return', ';']),
    new Product('BlockStatement', ['return', 'ArithmeticExpression', ';']),

    new Product('Type', ['int']),
    new Product('Type', ['float']),
    new Product('Type', ['double']),
    new Product('Type', ['bool']),
    new Product('Type', ['char']),

    new Product('ArithmeticExpression', ['ArithmeticExpression', 'ArithmeticOperator', 'ArithmeticExpression']),
    new Product('ArithmeticExpression', ['-', 'ArithmeticExpression']),
    new Product('ArithmeticExpression', ['(', 'ArithmeticExpression', ')']),
    new Product('ArithmeticExpression', ['identifier']),
    new Product('ArithmeticExpression', ['literal']),
    new Product('BoolExpression', ['ArithmeticExpression', 'ComparisonOperator', 'ArithmeticExpression']),
    new Product('BoolExpression', ['BoolExpression', '&&', 'BoolExpression']),
    new Product('BoolExpression', ['BoolExpression', '||', 'BoolExpression']),
    new Product('BoolExpression', ['!', 'BoolExpression']),
    new Product('BoolExpression', ['(', 'BoolExpression', ')']),
    new Product('BoolExpression', ['true']),
    new Product('BoolExpression', ['false']),

    new Product('ComparisonOperator', ['<']),
    new Product('ComparisonOperator', ['>']),
    new Product('ComparisonOperator', ['<=']),
    new Product('ComparisonOperator', ['>=']),
    new Product('ComparisonOperator', ['==']),
    new Product('ComparisonOperator', ['!=']),
    new Product('ArithmeticOperator', ['+']),
    new Product('ArithmeticOperator', ['-']),
    new Product('ArithmeticOperator', ['*']),
    new Product('ArithmeticOperator', ['/']),
  ]
};

const FIRST = getFirst(G);
const FOLLOW = getFollow(G, FIRST);
const [ACTION, GOTO] = getSLR1Table(G, FOLLOW);

function startAnalysis() {
  const code = document.getElementById('code').value;
  const tokens = lexicalAnalysis(code);
  renderTokens(tokens);
  syntaxAnalysis(tokens, ACTION, GOTO);
}

function renderTokens(tokens) {
  let html = '';
  tokens.forEach(token => {
    html += `<span class="text-gray-500">[</span>
      <span class="text-green-600">${token.type}</span> &nbsp;
      <span class="text-pink-500">${token.value}</span>
      <span class="text-gray-500">]</span>&nbsp;&nbsp;`;
  });
  document.getElementById('tokens').innerHTML = html;
}

function renderPage() {
  document.getElementById('G').innerHTML = `
    <span class="text-orange-400">S:</span><br>${G.S}<br>
    <span class="text-green-600">V:</span><br>${G.V.map(v => v).join(', ')}<br>
    <span class="text-purple-500">T:</span><br>${G.T.map(t => t).join(' &nbsp;')}<br>
    <span class="text-blue-600">P:</span><br>${G.P.map(p => p.l + '<span class="text-blue-600"> -> </span>' + p.r.join(' ')).join('<br>')}
  `;
  document.getElementById('FIRST').innerHTML = `
    ${Object.keys(FIRST).map(v => {
    return `
        <span class="text-gray-500">
          FIRST[ <span class="text-teal-500">${v}</span> ]:  { ${[...FIRST[v]].map(t => t).join('&nbsp; ')} }
        </span><br>
        `;
  }).join(' ')}
  `;
  document.getElementById('FOLLOW').innerHTML = `
    ${Object.keys(FOLLOW).map(v => {
    return `
        <span class="text-gray-500">
          FOLLOW[ <span class="text-teal-500">${v}</span> ]:  { ${[...FOLLOW[v]].map(t => t).join('&nbsp; ')} }
        </span><br>
        `;
  }).join(' ')}
  `;
  renderSLR1Table();
}

function renderSLR1Table() {
  // 输出ACTION和GOTO表到页面
  let write1 = "";
  write1 += "<span style='color:#FF7F50;text-align:center;'>ACTION Table:</span>";
  write1 += "<table border='1' cellspacing='0' align='center' ><tr>"
  write1 += "<th width='40px' style='text-align:center;'>" + " " + "</th>";

  let i = 0;
  T = G['T'];
  T.forEach(t => {
    write1 += "<th width='40px' style='text-align:center;'>" + t + "</th>";
    i++;
  });
  write1 += "<th width='40px' style='text-align:center;'>#</th></tr>";
  const transType = (a) => {
    if (a.type === 'shift') {
      return `s${a.index}`;
    } else if (a.type === 'reduce') {
      return `r${a.index}`;
    } else if (a.type === 'accept') {
      return 'acc';
    } else {
      return '';
    }
  }
  for (let i = 0; i < ACTION['identifier'].length; i++) {
    write1 += "<tr><td style='text-align:center;'>" + i + "</td>";
    T.forEach(t => {
      write1 += "<td style='text-align:center;'>" + transType(ACTION[t][i]) + "</td>";
    });
    write1 += "<td style='text-align:center;'>" + transType(ACTION['#'][i]) + "</td></tr>";
  }
  write1 += "</table>";

  let write2 = "";
  write2 += "<span style='color:#FF7F50;text-align:center;'>GOTO Table:</span>";
  write2 += "<table border='1' cellspacing='0' align='center'><tr>"
  write2 += "<th width='100px' style='text-align:center;'>" + " " + "</th>";

  t_V = G.V.slice(1);  //去除拓广文法开始符号
  t_V.forEach(v => {
    write2 += "<th width='100px' style='text-align:center;'>" + v + "</th>";
  });
  write2 += "</tr>";

  for (i = 0; i < GOTO['Program'].length; i++) {
    write2 += "<tr><td width='100px' style='text-align:center;'>" + i + "</td>";
    t_V.forEach(v => {
      write2 += "<td width='100px' style='text-align:center;'>" + GOTO[v][i] + "</td>";
    });
    write2 += "</tr>";
  }
  write2 += "</table>";

  document.getElementById('ACTION').innerHTML = write1;
  document.getElementById('GOTO').innerHTML = write2;
}