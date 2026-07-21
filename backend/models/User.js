import mongoose from 'mongoose'

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Name is required'],
      trim: true,
      minlength: [2, 'Name must be at least 2 characters'],
      maxlength: [50, 'Name cannot exceed 50 characters'],
    },
    email: {
      type: String,
      required: [true, 'Email is required'],
      unique: true,
      lowercase: true,
      trim: true,
      match: [/^\S+@\S+\.\S+$/, 'Please provide a valid email'],
    },
    password: {
      type: String,
      required: false,
      default: null,
      minlength: [8, 'Password must be at least 8 characters'],
      select: false,
    },
    avatar: {
      type: String,
      default: null,
    },
    oauthProviders: [
      {
        provider: { type: String, enum: ['google', 'github'], required: true },
        providerId: { type: String, required: true },
        email: { type: String, default: null },
        linkedAt: { type: Date, default: Date.now },
      },
    ],
    role: {
      type: String,
      enum: ['user', 'admin'],
      default: 'user',
    },
    isDisabled: {
      type: Boolean,
      default: false,
      index: true,
    },
    emailVerified: {
      type: Boolean,
      default: false,
    },
    emailVerificationToken: {
      type: String,
      default: null,
      index: { sparse: true },
    },
    emailVerificationExpires: {
      type: Date,
      default: null,
      index: { expires: 0, sparse: true },
    },
    passwordResetToken: {
      type: String,
      default: null,
      index: { sparse: true },
    },
    passwordResetExpires: {
      type: Date,
      default: null,
      index: { expires: 0, sparse: true },
    },
    loginAttempts: {
      type: Number,
      default: 0,
    },
    lockoutUntil: {
      type: Date,
      default: null,
    },
    lastLoginAt: {
      type: Date,
      default: null,
      index: true,
    },
    xp: {
      type: Number,
      default: 0,
      min: 0,
    },
    level: {
      type: Number,
      default: 1,
      min: 1,
    },
    streak: {
      type: Number,
      default: 0,
      min: 0,
    },
    lastActive: {
      type: Date,
      default: Date.now,
    },
    problemStats: {
      easy: { type: Number, default: 0 },
      medium: { type: Number, default: 0 },
      hard: { type: Number, default: 0 },
      total: { type: Number, default: 0 },
    },
    patternStats: {

      type: Object,
      default: () => ({}),
    },
    solvedProblems: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Problem',
      },
    ],
    savedProblems: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Problem',
      },
    ],
    badges: [
      {
        id: String,
        name: String,
        earnedAt: { type: Date, default: Date.now },
        icon: String,
      },
    ],
    activityLog: [
      {
        activity: String,
        xp: Number,
        date: { type: Date, default: Date.now },
      },
    ],
    preferences: {
      theme: { type: String, enum: ['dark', 'light'], default: 'dark' },
      notifications: { type: Boolean, default: true },
      preferredLanguage: { type: String, default: 'python' },
    },

    bookmarks: [
      {
        algorithmId: { type: String, required: true },
        bookmarkedAt: { type: Date, default: Date.now },
      },
    ],
    subscriptionType: {
      type: String,
      enum: ['free', 'premium'],
      default: 'free',
    },
    subscriptionExpiry: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
    toJSON: {

      transform(_doc, ret) {
        delete ret.password
        delete ret.passwordResetToken
        delete ret.passwordResetExpires
        delete ret.emailVerificationToken
        delete ret.emailVerificationExpires
        delete ret.loginAttempts
        delete ret.lockoutUntil
        return ret
      },
    },
  }
)

userSchema.index({ xp: -1 })
userSchema.index({ level: -1 })
userSchema.index(
  { 'oauthProviders.provider': 1, 'oauthProviders.providerId': 1 },
  { unique: true, sparse: true }
)

userSchema.virtual('totalProblemsSolved').get(function () {
  return this.solvedProblems.length
})

userSchema.pre('save', function (next) {
  this.lastActive = Date.now()
  next()
})

const User = mongoose.model('User', userSchema)

export default User
