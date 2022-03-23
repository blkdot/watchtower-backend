const mongoose = require('mongoose'),
  Admin = mongoose.model('Admin')

function temporaryAdminAuth(req, res, next) {
  if (req.headers.authorization && req.headers.authorization.split(' ')[0] === 'Bearer') {
    if (req.headers.authorization.split(' ')[1] === '39xV1029gKtppS4065HjJ90vVcc47372888qZddm') {
      return next()
    }
  }
  return res.sendStatus(401)
}

async function initDefaultAdminAccount() {
  let admin = await Admin.findOne({email: 'admin@cryptowatchtower.io'})

  if (!admin) {
    admin = new Admin()
    admin.email = 'admin@cryptowatchtower.io'
    admin.setPassword('Rugscanner2021!$m')
    await admin.save()

    console.log('[Admin] Created a new default admin account.')
  }
}

module.exports = {
  temporaryAdminAuth,
  initDefaultAdminAccount
}
