import mongoose from 'mongoose'
import { logger } from '../utils/logger.js'

const thresholdMs = parseInt(process.env.SLOW_QUERY_MS || '200', 10)

const instrument = () => {

  const origExec = mongoose.Model.prototype.exec
  mongoose.Model.prototype.exec = function patchedExec(...args) {
    const op = this.op || 'query'
    const modelName = this.model?.modelName || this.model?.collection?.name
    const start = process.hrtime.bigint()
    return origExec.apply(this, args).then(
      (res) => {
        const dur = Number(process.hrtime.bigint() - start) / 1e6
        if (dur >= thresholdMs) {
          logger.warn({ model: modelName, op, durationMs: Math.round(dur) }, 'slow query')
        }
        return res
      },
      (err) => { throw err }
    )
  }
}

export const installSlowQueryLogger = () => {
  try {
    instrument()
    logger.info({ thresholdMs }, 'slow-query logger installed')
  } catch (err) {
    logger.warn({ err: err.message }, 'failed to install slow-query logger')
  }
}
