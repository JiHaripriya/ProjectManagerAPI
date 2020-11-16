const singleToDouble = (number) => {
    if(String(number).length == 1) return `0${number}`
    else return number 
}

const getFullTime = (string) => {
    const toFormat = new Date(string)
    return `${toFormat.getHours()}:${toFormat.getMinutes()}:${singleToDouble(toFormat.getSeconds())}`
}

const getFullDate = (string) => {
    const toFormat = new Date(string)
    return `${toFormat.getFullYear()}-${singleToDouble(toFormat.getMonth() + 1)}-${singleToDouble(toFormat.getDate())}`
}

module.exports = {singleToDouble, getFullTime, getFullDate}