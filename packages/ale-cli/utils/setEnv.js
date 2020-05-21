module.exports = function setEnv(env = '') {
  const args = env.split('=');
  if (args.length === 2) {
    process.env[args[0]] = args[1];
  }
};
