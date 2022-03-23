module.exports.AuditRules = {
  contractAddress: ['required', 'regex:/0x[a-fA-F0-9]{40}/g'],
  ownerAddress: 'regex:/0x[a-fA-F0-9]{40}/g',
  liquidityPool: 'regex:/0x[a-fA-F0-9]{40}/g',
  utility: 'required',
  email: 'email',
  siteLink: 'url',
  approved: 'boolean'
}

module.exports.AdRules = {
  email: ['required', 'email'],
  approved: 'boolean',
  name: 'required',
  siteLink: ['required', 'url'],
  transactionLink: ['url'],
  activeDates: ['integer'],
}