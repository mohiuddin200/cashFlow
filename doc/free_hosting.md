● Based on your Firebase configuration and the Spark (Free) Plan, here's what your cashFlow app can
  handle without requiring payment:

  Firebase Free Tier Limits for Your App

  Authentication

  - Unlimited users can sign up and login
  - No limit on concurrent authenticated users
  - Supports both Google sign-in and email/password (which you're using)

  Firestore Database

  - 1 GB total storage across all users
  - 50,000 document reads per day
  - 20,000 document writes per day
  - 20,000 document deletes per day

  What This Means for Your App

  User Estimate:
  - Each user typically creates 50-200 transactions per year
  - With 1GB storage, you could support approximately 1,000-5,000 active users
  - Each user adds ~5-10KB of data per year (transactions + categories + settings)

  Daily Usage Limits:
  - 50,000 reads = ~1,000 users checking their data 50x per day
  - 20,000 writes = ~400 users making 50 transactions each per day
  - Real-time listeners (your onSnapshot calls) count as reads

  Hosting

  - 10 GB storage for your app files
  - 360 MB/day data transfer
  - Custom domain support (you have cashflow-d07b5.firebaseapp.com)

  Optimization Tips

  1. Implement pagination for transaction history to reduce reads
  2. Cache data locally to minimize database calls
  3. Batch operations when possible
  4. Remove inactive user data after long periods

  Bottom Line: You can comfortably support 1,000+ regular users on the free plan. The authentication
  is truly unlimited, but database usage will be your main constraint as users grow.
