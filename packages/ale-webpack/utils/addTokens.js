module.exports = function (opts = {}){
  if(opts.filename){
    opts.filename = opts.filename.replace('[time]', timeFormat(new Date()))
  }
  return opts;
}

function timeFormat(date){
  let year = date.getFullYear();
  let month = date.getMonth() + 1;
  let day = date.getDate();
  let h = date.getHours();
  let m = date.getMinutes();
  let s = date.getSeconds();
  return `${year}-${month}-${day}_${h}${m}${s}`;
}
