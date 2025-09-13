import mongoose from "mongoose";
import bcrypt from "bcrypt";

const userSchema = new mongoose.Schema({
    username: { type: String, required: true, unique: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true, select: false },
    phone: { type: String },
    address: { 
      street: { type: String, required: true },
      city: { type: String, required: true },
      state: { type: String, required: true },
      country: { type: String, required: true },
      postalCode: { type: String, required: true }
    },
    roles: { type: [String], enum: ['buyer', 'seller'], default: ['buyer'] },
    activeRole: { type: String, enum: ['buyer', 'seller'], default: 'buyer'},
    companyName : { type: String },
    profileImage: { type: String },
    resetToken: String,
    resetTokenExpiration: Date,
    settings: {
        notifications: {
          type: Boolean,
          default: true
        },
        emailUpdates: {
          type: Boolean,
          default: false
        }
      }
}, { timestamps: true });

userSchema.pre("save", async function (next) {
    if(!this.isModified("password") || !this.password) return next();
    this.password = await bcrypt.hash(this.password, 10);
    next();
});

const User = mongoose.model("User", userSchema);
export default User;