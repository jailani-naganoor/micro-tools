---
title: "Microphone Not Working on Windows or Mac? Try These Fixes"
description: "Step-by-step fixes for a mic that won't work on Windows 11 or macOS: mute, input device, privacy settings, browser permissions, drivers."
pubDate: 2026-10-18
updatedDate: 2026-10-19
draft: false
---

A microphone that suddenly stops working is frustrating, especially just before a call. The cause is usually simple: a mute switch, the wrong input device, or a permission that has been turned off. This guide walks through the checks in order, quickest first, for Windows 11 and macOS.

## Step 1: Check the hardware

Start with the physical basics before changing any settings.

1. **Look for a mute switch.** Many headsets have a mute button on the cable or earcup, and some USB microphones have a mute button or a light that changes colour when muted. Laptops often have a mute key on the keyboard.
2. **Reconnect the cable.** Unplug the microphone and plug it back in firmly. For USB microphones, try a different USB port, ideally one directly on the computer rather than on a hub.
3. **Check the jack type.** A headset with one combined plug may need a splitter adapter for a computer with separate headphone and microphone sockets.
4. **For Bluetooth headsets,** make sure the headset is paired, connected and charged.

## Step 2: Select the right input device

Computers often have several inputs, such as a built-in microphone, a webcam and a headset. The system may be listening to the wrong one.

### Windows 11

1. Open **Settings > System > Sound**.
2. Under **Input**, choose the microphone you want to use.
3. Select the arrow next to the device to open its properties. Adjust the **Input volume**, then use **Start test** and speak to check that it picks up sound.
4. If the test shows no signal, Microsoft suggests turning off audio enhancements for the device, usually found on the same properties page.

### macOS

1. Open **System Settings > Sound**.
2. Select the **Input** tab and choose your microphone from the list.
3. Speak and watch the **Input level** meter. Raise the **Input volume** slider if the meter barely moves. (Some digital microphones and audio interfaces don't allow this; set their level on the device itself.)

Menu names may differ slightly by version.

## Step 3: Check the operating system's privacy settings

Both systems can block apps from using the microphone. If access is off, apps see silence or no microphone at all.

### Windows 11

1. Open **Settings > Privacy & security > Microphone**.
2. Make sure **Microphone access** is on.
3. Make sure **Let apps access your microphone** is on, and check the toggle for the specific app you are using.
4. For desktop programs (including most browsers), make sure **Let desktop apps access your microphone** is on.

### macOS

1. Quit the app you want to use, such as your browser or video call app.
2. Open **System Settings > Privacy & Security > Microphone**.
3. Turn on the switch next to that app, then open it again.

If the app isn't in the list, it hasn't asked for microphone access yet. Open it and try to use the microphone, and macOS should ask you.

## Step 4: Check the browser's site permission

If the microphone works in other apps but not on a website, the browser may be blocking that site.

- **Chrome:** Click the site information icon at the left of the address bar and set **Microphone** to **Allow**. You can also go to **Settings > Privacy and security > Site settings > Microphone**, where you can also choose which microphone Chrome uses by default.
- **Edge:** Select the lock icon in the address bar and set **Microphone** to **Allow**, or open `edge://settings/content/microphone` and make sure this site is listed under **Allow**. In Edge Settings this is under **Cookies and site permissions > Site permissions**.
- **Firefox:** Click the permissions icon at the left of the address bar and click the **×** next to **Blocked** so Firefox asks again, or go to **Settings > Privacy & Security**, scroll to **Permissions** and click **Settings** next to **Microphone**.
- **Safari (Mac):** With the site open, choose **Safari > Settings for This Website**, or go to **Safari > Settings > Websites > Microphone**.

Menu names may differ slightly by version. After changing a permission, reload the page. Websites can only request the microphone over a secure (HTTPS) connection. On a work or school computer, your organisation may control these settings, so ask your IT team if you can't change them.

You can check whether your browser can hear you with the [microphone test](/#mic) on our home page. It shows a live level meter and lets you pick a different microphone from a list. The **Microphone details** panel shows what your browser reports about the microphone, such as its name, sample rate, channels and whether echo cancellation, noise suppression and auto gain control are on. Browsers don't share every value, so some may say "Not reported by this browser".

You can also switch noise suppression and echo cancellation on or off (the microphone restarts each time), record a 5-second clip with each setting and play it back to hear the difference. **Download recording** saves the clip straight to your device. The audio is processed in your browser and is never uploaded.

## Step 5: Close apps that might be holding the microphone

Sometimes another app has taken control of the microphone, or has its own mute switched on. Video call apps, recording software and voice chat programs are common causes.

1. Close any call, recording or streaming apps you are not using.
2. On a Mac, an orange dot next to the Control Center icon in the menu bar means an app is using the microphone (if the camera is in use too, you see a green dot instead). Open **Control Center** to see which app it is.
3. If in doubt, restart the computer. It clears most "device in use" problems.

Also check the microphone menu inside the app itself, which can point to a different device from the system default.

## Step 6: Update or reinstall drivers (Windows)

On Windows, a damaged or outdated driver can stop a microphone from appearing.

1. Windows has an automated audio troubleshooter. Open the **Get Help** app and search for the audio troubleshooter, then follow the steps.
2. Right-click the **Start** button and choose **Device Manager**.
3. Expand **Audio inputs and outputs** to find the microphone, or **Sound, video and game controllers** to find the audio hardware it is connected through.
4. Right-click the device and choose **Update driver**.
5. If that doesn't help, choose **Uninstall device**, then restart. Windows will usually reinstall it automatically.
6. Check **Windows Update** and your computer or microphone maker's website for audio driver updates.

On a Mac you don't normally install drivers for the built-in microphone yourself. If you use an external microphone or audio interface, check its maker's website for software updates and compatibility with your version of macOS.

## Still not working?

Try the microphone on another computer, and a different microphone on yours. That tells you whether the fault is the microphone or the computer. If only the built-in microphone has failed, contact the computer's manufacturer.
