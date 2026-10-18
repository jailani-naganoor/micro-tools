---
title: "Webcam Not Working in Your Browser? How to Fix It"
description: "Fix a webcam that won't work in Chrome, Edge, Firefox or Safari: site permissions, Windows and macOS camera privacy, HTTPS and apps using the camera."
pubDate: 2026-10-18
draft: true
---

Your webcam works in one app, but a website shows a black box or says no camera was found. When a camera fails only in the browser, the cause is almost always a permission setting at one of two levels: the browser's permission for that site, or the operating system's permission for the browser. This guide covers both, plus a few other common causes.

## How browser camera access works

A website cannot turn on your camera by itself. It has to ask the browser, the browser asks you, and the operating system must also allow the browser to use the camera. If any of these says no, the site gets no picture.

Browsers also only allow camera access on secure pages. The address must start with `https://` (local development addresses such as `localhost` are an exception). If a site loads over plain `http://`, the camera request is blocked before you are even asked.

## Step 1: Check the browser's site permission

If you clicked "Block" by mistake in the past, the browser remembers that choice and will not ask again.

### Google Chrome

1. Click the site information icon at the left of the address bar.
2. Set **Camera** to **Allow**, then reload the page.
3. To review all sites, go to **Settings > Privacy and security > Site settings > Camera**. This page also lets you choose which camera Chrome uses by default.

### Microsoft Edge

1. Click the icon at the left of the address bar and allow **Camera**.
2. Or go to **Settings > Privacy, search, and services > Site permissions** and open **Camera**. In older versions this was under **Cookies and site permissions**.

### Mozilla Firefox

1. Click the permissions icon in the address bar and clear any blocked camera permission.
2. Or go to **Settings > Privacy & Security**, scroll to **Permissions**, and click **Settings** next to **Camera** to remove or change saved decisions.

### Safari (Mac)

1. With the site open, choose **Safari > Settings for this Website** and set **Camera** to **Allow** or **Ask**.
2. Or go to **Safari > Settings > Websites > Camera** to see every site.

Menu names may differ slightly by version. After any change, reload the page.

## Step 2: Check the operating system's camera privacy settings

If the browser is not allowed to use the camera, no website can use it either.

### Windows 11

1. Open **Settings > Privacy & security > Camera**.
2. Make sure **Camera access** is on.
3. Make sure **Let apps access your camera** is on.
4. Make sure **Let desktop apps access your camera** is on. Most browsers count as desktop apps.

You can also check that Windows sees the camera in **Settings > Bluetooth & devices > Cameras**.

### macOS

1. Open **System Settings > Privacy & Security > Camera**.
2. Turn on the switch next to your browser.
3. Quit and reopen the browser so the change takes effect.

If your browser is not in the list, it has not asked for access yet. Visit a site that uses the camera and the request should appear.

## Step 3: Close other apps using the camera

On many systems, especially Windows, only one app can use a webcam at a time. If a video call app, the Camera app or recording software has the camera open, the browser may report that the camera is unavailable or in use.

1. Close video call, streaming and camera apps.
2. Close other browser tabs that might be using the camera.
3. Check your computer's camera light. If it is on while you are not using the camera, something else has it open.
4. If you cannot find the app, restart the computer.

## Step 4: Check the hardware

- **Privacy shutter:** Many laptops and webcams have a small sliding cover over the lens. A closed shutter gives a black image even though everything else works.
- **Camera key:** Some laptops have a keyboard key or switch that disables the camera. Check your laptop's manual.
- **USB connection:** For external webcams, unplug and reconnect, or try another USB port directly on the computer instead of a hub.
- **Drivers (Windows):** Right-click **Start**, open **Device Manager**, expand **Cameras**, and choose **Update driver**. If the camera shows a warning symbol, try **Uninstall device** and restart.

## Step 5: Make sure the right camera is selected

If you have more than one camera, such as a built-in camera and a USB webcam, the site may be using the wrong one. Most video sites have a camera selector in their settings. Chrome and Edge also let you pick a default camera in their camera permission settings.

## Test your camera

Once you have made changes, you can confirm the browser can see your camera with the [webcam test](/#webcam) on our home page. The video stays on your device and is not uploaded.

## Still stuck?

Try a different browser. If the camera works in one browser but not another, the problem is that browser's settings or extensions, so try disabling extensions or using a private window. If the camera does not work in any app at all, the issue is with the hardware or drivers, and the manufacturer's support pages are the next place to look.
