const {AuditRules} = require('../conf/rules')
const Validator = require('validatorjs')

const data = {
  utility: 'John',
  contractAddress: '0x18b57a558e9febba7f30c79f71fb44d5348b207c',
  liquidityPool: 'sadflkj',
  email: 'abc',
  cost: 12
}

let validator = new Validator(data, AuditRules)

console.log('Passed: ', validator.passes())
console.log('Errors: ', validator.errors.all())
