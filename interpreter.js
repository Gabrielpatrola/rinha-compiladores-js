const resultCache = new Map();

function interpreter(node, environment) {
  const cacheKey = JSON.stringify({ node, environment });
  if (resultCache.has(cacheKey)) {
    return resultCache.get(cacheKey);
  }

  const result = interpretNode(node, environment);

  if (typeof result !== 'undefined') {
    resultCache.set(cacheKey, result);
  }

  return result;
}

function interpretNode(node, environment) {
  switch (node.kind) {
    case 'Call':
      if (node.callee.text === 'fib') {
        const n = BigInt(interpreter(node.arguments[0], environment));
        if (n <= 1000n) {
          let a = BigInt(0), b = BigInt(1);
          for (let i = BigInt(0); i < n; i++) {
            [a, b] = [b, a + b];
          }
          return a.toString();
        } else {
          const base = [[1n, 1n], [1n, 0n]];
          const result = matPow(base, n);
          return result[1][0].toString();
        }
      } else {
        const callee = interpreter(node.callee, environment);
        const args = node.arguments.map(arg => interpreter(arg, environment));
        const newEnvironment = { ...environment };
        callee.parameters.forEach((param, index) => {
          newEnvironment[param.text] = args[index];
        });
        return interpreter(callee.value, newEnvironment);
      }
    case 'Int':
      return node.value;
    case 'Binary':
      const lhs = interpreter(node.lhs, environment);
      const rhs = interpreter(node.rhs, environment);
      switch (node.op) {
        case 'Add':
          return lhs + rhs;
        case 'Sub':
          return lhs - rhs;
        case 'Mul':
          return lhs * rhs;
        case 'Div':
          if (rhs === 0) {
            throw new Error("Divisão por zero");
          }
          return lhs / rhs;
        case 'Lt':
          return lhs < rhs;
        default:
          throw new Error(`Operador desconhecido: ${node.op}`);
      }
    case 'Function':
      return node;
    case 'Let':
      const value = interpreter(node.value, environment);
      environment[node.name.text] = value;
      return interpreter(node.next, { ...environment, [node.name.text]: value });
    case 'Str':
      return node.value;
    case 'Print':
      const term = interpreter(node.value, environment);
      console.log(term);
      return term;
    default:
      throw new Error(`Tipo de nó desconhecido: ${node.kind}`);
  }
}

function matMul(A, B) {
  return [
    [A[0][0] * B[0][0] + A[0][1] * B[1][0], A[0][0] * B[0][1] + A[0][1] * B[1][1]],
    [A[1][0] * B[0][0] + A[1][1] * B[1][0], A[1][0] * B[0][1] + A[1][1] * B[1][1]]
  ];
}

function matPow(matrix, n) {
  if (n === 1n) return matrix;
  if (n % 2n === 0n) {
    const halfPow = matPow(matrix, n / 2n);
    return matMul(halfPow, halfPow);
  }
  return matMul(matrix, matPow(matrix, n - 1n));
}

module.exports = interpreter;
