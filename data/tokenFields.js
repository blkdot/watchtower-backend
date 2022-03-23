const EditableTokenFields = 
{
  "mintEnabled": {
    type: "boolean",
  },
  "riskRating": {
    type: "number"
  },
  "honeypot": {
    type: "string",
  },
  "isScammer": {
    type: "boolean"
  }
}

function isValidFields(field) {
  return Object.keys(EditableTokenFields).findIndex(f => f === field) >= 0
}

function isValidValueFormat(field, value) {
  return (typeof value) === EditableTokenFields[field].type
}

function castValueTypeFromString(field, value) {
  if (field === 'honeypot') return value
  return Number(value)
}

module.exports = {
  EditableTokenFields,
  isValidFields,
  isValidValueFormat,
  castValueTypeFromString
}
