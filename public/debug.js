function debug(...strings) {
  if(DEBUGGING) {
    console.log(strings.reduce((previous, current) => {
      return previous + "" + current
    }))
  }
}