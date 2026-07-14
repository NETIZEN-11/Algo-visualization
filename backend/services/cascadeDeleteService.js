/**
 * Cascade-delete service.
 *
 * Removing a user is a multi-collection operation. We do it in a single
 * pass to keep the delete fast and to avoid leaving orphaned records
 * (notes, submissions, refresh tokens, etc.).
 */
import mongoose from 'mongoose'

const collectionsToClear = async (userId) => {
  const db = mongoose.connection.db
  const promises = [
    db.collection('refreshTokens').deleteMany({ userId }),
    db.collection('notes').deleteMany({ userId }),
    db.collection('submissions').deleteMany({ userId }),
    db.collection('flashcards').deleteMany({ userId }),
    db.collection('interviews').deleteMany({ userId }),
    db.collection('aiusages').deleteMany({ userId }),
    db.collection('contestparticipations').deleteMany({ userId }),
    db.collection('challengeparticipations').deleteMany({ userId }),
    db.collection('roadmaps').deleteMany({ userId }),
    db.collection('userprogresses').deleteMany({ userId }),
  ]
  await Promise.all(promises)
}

export const cascadeDeleteUser = async (userId) => {
  await collectionsToClear(userId)
  await mongoose.model('User').deleteOne({ _id: userId })
}
