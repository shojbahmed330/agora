# Agora One-to-One Call Token Server (Vercel)

এটি একটি ছোট Vercel-compatible token & call-create server যা Facebook-style one-to-one voice/video calls তৈরিতে সহায়ক।  

## ফিচার (সারাংশ)
- `/api/create_call` (POST) → automatic `channelName` তৈরি করে (pair-based বা one-time)
- `/api/token` (GET/POST) → `channelName` ও `uid` দিয়ে Agora RTC/RTM token জেনারেট করে দেয়

## ফাইল স্ট্রাকচার
