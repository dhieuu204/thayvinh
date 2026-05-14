const passport = require("passport");
const { Strategy: GoogleStrategy } = require("passport-google-oauth20");
const User = require("../models/User");

if (process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET) {
  passport.use(
    new GoogleStrategy(
      {
        clientID:     process.env.GOOGLE_CLIENT_ID,
        clientSecret: process.env.GOOGLE_CLIENT_SECRET,
        callbackURL:  `${process.env.SERVER_URL || "http://localhost:3000"}/api/auth/google/callback`,
      },
      async (accessToken, refreshToken, profile, done) => {
        try {
          // 1. Tìm theo googleId (kể cả soft-deleted → reactivate)
          let user = await User.findOne({ googleId: profile.id }).select("+googleId");
          if (user) {
            if (user.deletedAt) {
              user.deletedAt = null;
              await user.save();
            }
            return done(null, user);
          }

          // 2. Tìm theo email → liên kết tài khoản (kể cả soft-deleted → reactivate)
          const email = profile.emails?.[0]?.value?.toLowerCase();
          if (email) {
            user = await User.findOne({ email }).select("+googleId");
            if (user) {
              user.googleId   = profile.id;
              user.isVerified = true;
              user.deletedAt  = null; // reactivate nếu bị soft-delete
              if (!user.avatarUrl) user.avatarUrl = profile.photos?.[0]?.value || "";
              await user.save();
              return done(null, user);
            }
          }

          // 3. Tạo tài khoản mới (email chưa tồn tại)
          user = await User.create({
            googleId:   profile.id,
            email:      email || `google_${profile.id}@noemail.placeholder`,
            fullName:   profile.displayName || "",
            avatarUrl:  profile.photos?.[0]?.value || "",
            isVerified: true,
          });
          return done(null, user);
        } catch (err) {
          // E11000: email vừa được tạo bởi request khác → tìm và liên kết
          if (err.code === 11000) {
            const email = profile.emails?.[0]?.value?.toLowerCase();
            const user  = await User.findOne({ email }).catch(() => null);
            if (user) {
              user.googleId = profile.id;
              await user.save().catch(() => {});
              return done(null, user);
            }
          }
          return done(err, null);
        }
      }
    )
  );
}

module.exports = passport;
