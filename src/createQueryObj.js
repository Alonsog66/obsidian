export default function(queryName, query, obsidianSchema) {
  // Make an object
  const queryObj = {
    queryName,
    parameters: {}
  };

  // Some variables
  const brackets = [];
  let i = query.indexOf(queryName) + queryName.length;
  let parameterName = '';
  let parameterValue = '';
  let onName = false;
  let onValue = false;

  while (brackets.length === 0) {
    if (query[i] === ' ') {
      // Skipping everything else for whitespace
    } else if (query[i] === '{') {
      brackets.push('{');
    } else if (query[i] === '(') {
      onName = true;
    } else if (query[i] === ')' || query[i] === ',') {
      if (obsidianSchema.argTypes[queryName][parameterName] !== 'ID') throw new Error('We do not support non-ID parameters.');
      queryObj.parameters[parameterName] = parameterValue;
      onValue = false;
      onName = true;
    } else if (query[i] === ':' && onName) {
      onName = false;
      onValue = true;
    } else {
      if (onName) {
        parameterName += query[i];
      } else if (onValue) {
        parameterValue += query[i];
      }
    }
    i++;
  }


  queryObj.properties = buildPropertyObject(query, i).propsObj;

  console.log('Obsidian Query Object:')
  console.log(queryObj);

  return queryObj;
}

function buildPropertyObject(query, startIdx) {
  const propsObj = {};
  let i = startIdx;
  let property = '';
  let lastStoredProp;
  let response;

  while (true) {
    if (query[i] === ' ' && !property) {
      // do nothing, eat
    } else if (query[i] === ' ') {
      propsObj[property] = true;
      lastStoredProp = property;
      property = '';
    } else if (query.slice(i, i+2) === '\\n' && property) {
      propsObj[property] = true;
      lastStoredProp = property;
      property = '';
      i++;
    } else if (query[i] === '{' && property) {
      response = buildPropertyObject(query, i+1);
      propsObj[property] = response.propsObj;
      property = '';
      i = response.index;
    } else if (query[i] === '{') {
      response = buildPropertyObject(query, i+1);
      propsObj[lastStoredProp] = response.propsObj;
      i = response.index;
    } else if (query[i] === '}') {
      return {
        index: i,
        propsObj
      }
    } else if (query.slice(i, i+2) === '\\n') {
      i++;
    } else {
      property += query[i];
    }
    i++;
  }
}
