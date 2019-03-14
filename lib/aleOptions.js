const passOpts = opts => opts ;

module.exports = {
  html: {},
  babel: passOpts,
  loader: passOpts,
  browserslist: [ '> 1%', 'last 4 versions', 'Firefox ESR', 'not ie < 9' ]
};
