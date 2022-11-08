const keywords = [
  'char', 'double', 'enum', 'float',
  'int', 'long', 'short', 'signed',
  'struct', 'union', 'unsigned', 'void',
  'for', 'do', 'while', 'break', 'continue',
  'if', 'else', 'goto',
  'switch', 'case', 'functionault', 'return',
  'auto', 'extern', 'register', 'static',
  'const', 'sizeof', 'typefunction', 'volatile',
];

const operators = [
  '+', '-', '*', '/', '%', '++', '--',
  '==', '!=', '>', '<', '>=', '<=', 
  '&', '|',
  '&&', '||', '!',
  '=', '+=', '-=', '+=', '/=', '%=', 
];

const delimiters = ['{', '}', '[', ']', '(', ')', ',', '.', ';'];

function lexicalAnalysis(sourceCode) {
  // delete comments and extra spaces
  const code = sourceCode.replace(/\/\/.*|\/\*[\s\S]*?\*\//g, '').replace(/\s+/g, ' ');
  const tokens = [];
  let index = 0;
  while (index < code.length) {
    // skip spaces
    if (code[index] === ' ') {
      index++;
      continue;
    }
    // delimiters
    if (delimiters.includes(code[index])) {
      tokens.push({
        type: 'delimiter',
        value: code[index],
      });
      index++;
      continue;
    }
    // operators
    if (operators.includes(code[index])) {
      tokens.push({
        type: 'operator',
        value: code[index],
      });
      index++;
      continue;
    } else if (index < code.length - 1 && operators.includes(code[index] + code[index + 1])) {
      tokens.push({
        type: 'operator',
        value: code[index] + code[index + 1],
      });
      index += 2;
      continue;
    }
    // string literal
    if (code[index] === '"') {
      let value = '';
      index++;
      while (code[index] !== '"') {
        value += code[index];
        index++;
        if (index >= code.length) {
          throw new Error('String literal is not closed');
        }
      }
      tokens.push({
        type: 'literal',
        value,
      });
      index++;
      continue;
    }
    // number literal
    if (/\d|\-/.test(code[index])) {
      let value = '';
      let hasDigit = false;
      while (/\d|\./.test(code[index])) {
        if (/\./.test(code[index])) {
          if (hasDigit) {
            throw new Error('Invalid number literal');
          }
          hasDigit = true;
        }
        value += code[index];
        index++;
        if (index >= code.length) break;
      }
      if (/[a-zA-Z_]/.test(code[index])) {
        throw new Error(`Invalid Syntax: Identifier can't start with a number`);
      }
      tokens.push({
        type: 'literal',
        value,
      });
      continue;
    }
    // keywords and identifiers
    if (/[a-zA-Z_]/.test(code[index])) {
      let value = '';
      while (/[a-zA-Z_0-9]/.test(code[index])) {
        value += code[index];
        index++;
        if (index >= code.length) break;
      }
      if (keywords.includes(value)) {
        tokens.push({
          type: 'keyword',
          value,
        });
      } else {
        tokens.push({
          type: 'identifier',
          value,
        });
      }
      continue;
    }
  }
  return tokens;
}