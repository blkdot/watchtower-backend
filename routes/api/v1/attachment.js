const mongoose = require('mongoose')
const router = require('express').Router()
const aws = require('aws-sdk')

const Cors = require('../../../conf/cors')
const slowDown = require('../../../conf/slowdown')

aws.config.region = 'us-east-1'
const s3 = new aws.S3()

router.post('/get-pre-signed-url', slowDown, Cors, async function(req, res, next) {
  if (req.body.fileSize > 4096 * 1024) {
    return res.sendStatus(500)
  }

  const fileName = Date.now() + '_' + req.body.fileName,
    fileType = req.body.fileType

  const s3Params = {
    Bucket: process.env.AWS_S3_BUCKET,
    Key: fileName,
    Expires: 120,
    ContentType: fileType,
    ACL: 'public-read'
  }

  s3.getSignedUrl('putObject', s3Params, (err, data) => {
    if (err) {
      console.error('[s3-presign] error has been encountered.')
      console.log(err)
      return res.sendStatus(500)
    }

    console.log('\n\n[s3-presign] signed-request: ', data)
    console.log('[s3-presign] url: ', `https://${process.env.AWS_S3_BUCKET}.s3.amazonaws.com/${fileName}\n\n`)

    return res.json({
      signedRequest: data,
      url: `https://${process.env.AWS_S3_BUCKET}.s3.amazonaws.com/${fileName}`
    })
  });
})

module.exports = router
