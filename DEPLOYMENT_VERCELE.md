# Put the FleetDesk demo online

This project already contains its website, server, and sample demo data. The files in `render.yaml` tell Render how to start it, so you do not need to rewrite the app or run commands yourself.

## Publish it

1. Sign in to [Render](https://render.com/) using GitHub.
2. In the Render dashboard, choose **New +** → **Blueprint**.
3. Connect the GitHub repository that contains FleetDesk and choose its branch.
4. Render will find `render.yaml`. Choose **Apply** to create the website.
5. Wait for the service to finish deploying, then open the `onrender.com` link Render shows you.

That link is your public demo website. Render can redeploy it when you push changes to GitHub.

## Demo login

The sign-in page has one-click demo account buttons. You can also use:

- Admin: `admin` / `Admin@123`
- Staff: `staff1` / `Staff@123`
- Customer: `rahul` / `Customer@123`

## Important for a class demo

The free hosting setup uses temporary disk storage. It is suitable for showing and trying the app, but bookings or other changes can reset after the service restarts or redeploys. The demo starts with the sample vehicles, accounts, and bookings already included in the repository.
