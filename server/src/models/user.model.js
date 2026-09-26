import mongoose from "mongoose";
import bcrypt from "bcrypt";

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
    },
    email: {
      type: String,
      trim: true,
      lowercase: true,
      index: {
        unique: true,
        partialFilterExpression: { email: { $type: "string", $gt: "" } },
      },
    },
    // Phone number used as WhatsApp-style contact identifier
    phone: {
      type: String,
      trim: true,
      index: {
        unique: true,
        partialFilterExpression: { phone: { $type: "string", $gt: "" } },
      },
    },
    password: {
      type: String,
    },
    google_id: {
      type: String,
    },
    loginType: {
      type: String,
      enum: ["normal_user", "google_user", "hybrid_user"],
    },
    isVerified: {
      type: Boolean,
      default: false,
    },
    otp: {
      type: String,
    },
    otpExpires: {
      type: Date,
    },
    avatar: {
      type: String,
      default: "",
    },
    online: {
      type: Boolean,
      default: false,
    },
    // User status quote / description (PRD GuftguAbout)
    about: {
      type: String,
      default: "Hey there! I am using ChatApp.",
      trim: true,
      maxlength: 140,
    },
    // WhatsApp-style contacts — only users explicitly added by phone number
    contacts: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
      },
    ],
    // Custom names/nicknames given to contacts by this user
    contactNicknames: [
      {
        userId: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "User",
        },
        customName: {
          type: String,
          trim: true,
        },
      },
    ],
    privacySettings: {
      lastSeen: {
        type: String,
        enum: ["everyone", "contacts", "nobody"],
        default: "everyone",
      },
      readReceipts: {
        type: Boolean,
        default: true,
      },
      profilePhoto: {
        type: String,
        enum: ["everyone", "contacts", "nobody"],
        default: "everyone",
      },
      about: {
        type: String,
        enum: ["everyone", "contacts", "nobody"],
        default: "everyone",
      },
      disappearingMessageTimer: {
        type: String,
        enum: ["off", "24h", "7d", "90d"],
        default: "off",
      },
    },
    blockedUsers: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
      },
    ],
    // Linked Devices (PRD Section 70-72)
    linkedDevices: [
      {
        deviceId: { type: String, required: true },
        deviceName: { type: String, default: "Web Browser" },
        browser: { type: String, default: "Chrome" },
        os: { type: String, default: "Windows" },
        lastActive: { type: Date, default: Date.now },
      },
    ],
  },
  { timestamps: true },
);

// Clean empty email / phone before validation so they don't trigger unique index
userSchema.pre("validate", function () {
  if (!this.phone) {
    this.phone = undefined;
  }
  if (!this.email) {
    this.email = undefined;
  }
});

// Hash password before saving
userSchema.pre("save", async function () {
  if (!this.isModified("password") || !this.password) return;
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
});

// Method to compare passwords
userSchema.methods.matchPassword = async function (enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

const User = mongoose.model("User", userSchema);
export default User;
