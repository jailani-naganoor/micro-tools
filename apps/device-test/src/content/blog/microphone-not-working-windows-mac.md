---
title: "Microphone Not Working on Windows or Mac? Try These Fixes"
description: "Step-by-step fixes for a mic that won't work on Windows 11 or macOS: mute, input device, privacy settings, browser permissions, drivers."
pubDate: 2026-10-18
draft: true
---

A microphone that suddenly stops working is frustrating, especially just before a call. The cause is usually simple: a mute switch, the wrong input device, or a permission that has been turned off. This guide walks through the checks in order, quickest first, for Windows 11 and macOS.

## Step 1: Check the hardware

Start with the physical basics before changing any settings.

1. **Look for a mute switch.** Many headsets have a mute button on the cable or earcup, and some USB microphones have a mute button or a light that changes colour when muted. Laptops often have a mute key on the keyboard.
2. **Reconnect the cable.** Unplug the microphone and plug it back in firmly. For USB microphones, try a different USB port, ideally one directly on the computer rather than on a hub.
3. **Check the jack type.** A headset with one combined plug may need a splitter adapter for a computer with separate headphone and microphone sockets.
4. **For Bluetooth headsets,** make sure the headset is connected and charged.

## Step 2: Select the right input device

Computers often have several inputs, such as a built-in microphone, a webcam and a headset. The system may be listening to the wrong one.

### Windows 11

1. Open **Settings > System > Sound**.
2. Under **Input**, choose the microphone you want to use.
3. Select the device to open its properties, check that it is allowed, and adjust the input volume. Speak and watch the level bar move.

### macOS

1. Open **System Settings > Sound**.
2. Select the **Input** tab and choose your microphone from the list.
3. Speak and watch the **Input level** meter. Raise the **Input volume** slider if the meter barely moves.

Menu names may differ slightly by version.

## Step 3: Check the operating system's privacy settings

Both systems can block apps from using the microphone. If access is off, apps see silence or no microphone at all.

### Windows 11

1. Open **Settings > Privacy & security > Microphone**.
2. Make sure **Microphone access** is on.
3. Make sure **Let apps access your microphone** is on, and check the toggle for the specific app you are using.
4. For desktop programs (including most browsers), make sure **Let desktop apps access your microphone** is on.

### macOS

1. Open **System Settings > Privacy & Security > Microphone**.
2. Turn on the switch next to the app you want to use, such as your browser or video call app.
3. If you just changed the setting, quit and reopen the app so it picks up the change.

## Step 4: Check the browser's site permission

If the microphone works in other apps but not on a website, the browser may be blocking that site.

- **Chrome:** Click the site information icon at the left of the address bar and set **Microphone** to Allow. You can also go to **Settings > Privacy and security > Site settings > Microphone**, where you can also choose which microphone Chrome uses by default.
- **Edge:** Click the icon at the left of the address bar, or go to **Settings > Privacy, search, and services > Site permissions** and open **Microphone**. In older versions this section was called **Cookies and site permissions**.
- **Firefox:** Click the permissions icon in the address bar to clear a blocked permission, or go to **Settings > Privacy & Security > Permissions > Microphone > Settings**.
- **Safari (Mac):** With the site open, choose **Safari > Settings for this Website**, or go to **Safari > Settings > Websites > Microphone**.

After changing a permission, reload the page. Websites can only request the microphone over a secure (HTTPS) connection.

You can check whether your browser can hear you with the [microphone test](/#mic) on our home page. The audio is processed in your browser and is not uploaded.

## Step 5: Close apps that might be holding the microphone

Sometimes another app has taken control of the microphone, or has its own mute switched on. Video call apps, recording software and voice chat programs are common causes.

1. Close any call, recording or streaming apps you are not using.
2. On a Mac, an orange dot near the top right of the screen means an app is currently using the microphone. Open **Control Center** to see which one.
3. If in doubt, restart the computer. It clears most "device in use" problems.

Also check the microphone menu inside the app itself, which can point to a different device from the system default.

## Step 6: Update or reinstall drivers (Windows)

On Windows, a damaged or outdated driver can stop a microphone from appearing.

1. Right-click the **Start** button and choose **Device Manager**.
2. Expand **Audio inputs and outputs**.
3. Right-click your microphone and choose **Update driver**.
4. If that doesn't help, choose **Uninstall device**, then restart. Windows will usually reinstall it automatically.
5. Check **Windows Update** and your computer or microphone maker's website for audio driver updates.

On a Mac, drivers come with system updates, so keep macOS up to date in **System Settings > General > Software Update**.

## Still not working?

Try the microphone on another computer, and a different microphone on yours. That tells you whether the fault is the microphone or the computer. If only the built-in microphone has failed, contact the computer's manufacturer.
