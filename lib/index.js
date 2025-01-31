"use strict";

/**
 * Module dependencies
 */

/* eslint-disable no-unused-vars */
// Public node modules.
const _ = require("lodash");
const AWS = require("aws-sdk");

module.exports = {
  init(config) {
    const { aws, imgix } = config;

    const S3 = new AWS.S3({
      apiVersion: "2006-03-01",
      ...aws,
    });

    return {
      upload(file, customParams = {}) {
        return new Promise((resolve, reject) => {
          // upload file on S3 bucket
          const path = imgix.pathPrefix ? `${imgix.pathPrefix}/` : "";
          S3.upload(
            {
              Key: `${path}${file.hash}${file.ext}`,
              Body: Buffer.from(file.buffer, "binary"),
              ACL: "private",
              ContentType: file.mime,
              ...customParams,
            },
            (err, data) => {
              if (err) {
                return reject(err);
              }

              // set the bucket file url
              const expr = new RegExp(
                `^http[s]{0,1}:\\/\\/${aws.params.Bucket}.[\\w-\\.]+(\\/${
                  imgix.pathPrefix || "prefix"
                }){0,1}\\/(.*)$`
              );

              if (!expr.test(data.Location)) {
                return reject(
                  new Error(
                    `${
                      data.Location
                    } does not match URL Schema: '^http[s]{0,1}:\\/\\/${
                      aws.params.Bucket
                    }.[\\w-\\.]+(\\/${
                      imgix.pathPrefix || "prefix"
                    }){0,1}\\/(.*)$'`
                  )
                );
              }

              // matches: Array(3). Capture Group [1] is imgix.pathPrefix, Capture Group [2] is Image URI.
              const matches = data.Location.match(expr);
              file.url = `${imgix.domain}/${imgix.pathPrefix}/${matches[2]}`;

              resolve();
            }
          );
        });
      },
      delete(file, customParams = {}) {
        return new Promise((resolve, reject) => {
          // delete file on S3 bucket
          const path = imgix.pathPrefix ? `${imgix.pathPrefix}/` : "";
          S3.deleteObject(
            {
              Key: `${path}${file.hash}${file.ext}`,
              ...customParams,
            },
            (err, data) => {
              if (err) {
                return reject(err);
              }

              resolve();
            }
          );
        });
      },
    };
  },
};
