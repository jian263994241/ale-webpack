const deepmerge = require('deepmerge');

const combineMerge = (target, source, options) => {
  const destination = target.slice()

  source.forEach((item, index) => {
      if (typeof destination[index] === 'undefined') {
        destination[index] = options.cloneUnlessOtherwiseSpecified(item, options);
      } else if (options.isMergeableObject(item)) {
        destination[index] = merge(target[index], item, options);
      } else if (target.indexOf(item) === -1) {
        destination[index] = item;
      }
  })
  return destination;
};

const merge = (x, y, options = { arrayMerge: combineMerge }) => deepmerge(x, y, options);

module.exports = merge;