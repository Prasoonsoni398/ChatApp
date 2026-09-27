# WhatsApp Status Upload — Detailed PRD & Design Specification

**Product:** WhatsApp-inspired Status  
**Platforms:** Android, iOS, WhatsApp Web, Desktop  
**Version:** 2.0  
**Document:** Product Requirements + UX/UI + Functional + Technical Specification

---

## 1. Product Overview

Status allows users to publish temporary photo, video, text, GIF, and audio-enhanced updates to a controlled audience. The experience should work consistently across mobile and web while using platform-specific interaction patterns.

### Core workflow

```text
Create → Select Media → Edit → Trim Video → Add Music → Trim Music
→ Add Text/Emoji/Stickers → Preview → Caption → Privacy → Upload
→ Process → Publish → View → Expire
```

---

## 2. Objectives

- Publish photo, video, and text Status quickly.
- Provide a polished WhatsApp-like visual experience.
- Support Mobile and Web.
- Provide video portion selection.
- Provide song/music search, preview, and portion selection.
- Synchronize Status across linked devices.
- Provide privacy controls.
- Provide upload progress, retry, and offline recovery.
- Preserve edits through drafts where supported.
- Provide accessible and responsive interfaces.

---

## 3. Scope

### In Scope

- Photo Status
- Video Status
- Text Status
- GIF where supported
- Camera/gallery/file picker
- Crop and rotate
- Video trimming
- Audio/music library
- Song search and preview
- Song portion selector
- Audio/video synchronization
- Audio volume controls
- Text overlays
- Emoji
- Stickers
- Drawing
- Filters
- Captions
- Mentions where supported
- Status privacy
- Preview
- Upload processing
- Retry and network recovery
- Status deletion
- 24-hour expiration
- Mobile/Web synchronization
- Accessibility
- Analytics

### Out of Scope for V1

- Professional video editing
- Multi-track professional timelines
- Scheduled Status
- AI-generated Status
- Monetization
- External social publishing

---

# 4. User Personas

### Casual User
Needs a fast photo/video sharing flow with minimal editing.

### Social User
Needs music, trimming, stickers, text, filters, and visual customization.

### Business User
Needs captions, controlled audiences, announcements, and reliable publishing.

---

# 5. Information Architecture

```text
WhatsApp
├── Chats
├── Updates
│   ├── My Status
│   ├── Recent Updates
│   ├── Viewed Updates
│   └── Muted Updates
├── Channels
└── Calls
```

---

# 6. Status Entry Points

## Mobile

- Updates tab
- My Status card
- Camera button
- Gallery/media button
- Add button

## Web

- Updates tab
- My Status card
- Add Status button
- File picker
- Drag-and-drop area

---

# 7. Mobile Status List Design

```text
┌─────────────────────────────────┐
│ Updates                         │
│                                 │
│ Status                          │
│                                 │
│  ◉  My Status              +    │
│     Add a status update         │
│                                 │
│ Recent updates                  │
│                                 │
│  ◯  Contact 1                   │
│     12 minutes ago              │
│                                 │
│  ◯  Contact 2                   │
│     1 hour ago                  │
└─────────────────────────────────┘
```

The user's own Status should be visually prominent and expose the creation action.

---

# 8. Mobile Camera Flow

```text
Open Camera
    ↓
Capture Photo / Record Video
    ↓
Preview
    ↓
Edit
    ↓
Publish
```

### Controls

- Close
- Flash
- Camera switch
- Capture
- Video recording
- Gallery preview

The camera interface should use large touch-friendly controls.

---

# 9. Mobile Gallery Flow

```text
Gallery
  ↓
Recent / Albums
  ↓
Select Photo or Video
  ↓
Next
  ↓
Editor
```

The picker should clearly identify selected media and support preview before entering the editor.

---

# 10. Web File Flow

```text
Updates
  ↓
My Status
  ↓
Upload Status
  ↓
Choose File / Drag & Drop
  ↓
Validate
  ↓
Editor
```

The Web editor should support desktop file selection and drag-and-drop where available.

---

# 11. Status Types

| Type | Mobile | Web |
|---|---|---|
| Photo | Yes | Yes |
| Video | Yes | Yes |
| Text | Yes | Yes |
| GIF | Where supported | Where supported |
| Music | Where supported/licensed | Where supported/licensed |

---

# 12. Status Editor

The editor is the central experience.

## Mobile

Use a full-screen dark media canvas with compact top and bottom controls.

```text
┌───────────────────────────────┐
│ ×        Edit        ⋮        │
│                               │
│                               │
│         MEDIA PREVIEW         │
│                               │
│                               │
│                               │
│ Text  Emoji  Sticker  Draw    │
│ Crop  Music  Trim             │
│                               │
│                         Next  │
└───────────────────────────────┘
```

## Web

Use a multi-panel editor:

```text
┌────────────────────────────────────────────────────────┐
│ ← Back                                  Preview Publish│
├──────────────┬───────────────────────┬─────────────────┤
│ Tools        │                       │ Properties      │
│              │     MEDIA PREVIEW     │                 │
│ Crop         │                       │ Caption         │
│ Rotate       │                       │ Music           │
│ Text         │                       │ Audio           │
│ Emoji        │                       │ Privacy         │
│ Sticker      │                       │                 │
│ Draw         │                       │                 │
│ Music        │                       │                 │
├──────────────┴───────────────────────┴─────────────────┤
│ Video / Audio Timeline                                 │
└────────────────────────────────────────────────────────┘
```

---

# 13. Design Language

The interface should be inspired by familiar messaging-app patterns without requiring an exact copy.

### Principles

- Minimal chrome
- Dark editor canvas
- Strong media focus
- Rounded controls
- Clear primary action
- Subtle transitions
- High-contrast controls
- Large mobile touch targets
- Keyboard-friendly Web controls

### Example design tokens

```css
:root {
  --primary: #25D366;
  --primary-dark: #128C7E;
  --background: #ffffff;
  --surface: #f7f8fa;
  --text-primary: #111b21;
  --text-secondary: #667781;
  --border: #e9edef;
  --editor-background: #101010;
  --radius-sm: 8px;
  --radius-md: 12px;
  --radius-lg: 16px;
  --spacing-unit: 4px;
}
```

These are implementation examples for a WhatsApp-inspired product, not claims about proprietary internal tokens.

---

# 14. Typography

Suggested hierarchy:

```text
Page title:      20–24px
Section heading: 16–18px
Body:            14–16px
Caption:         13–15px
Metadata:        12–13px
```

Use a clean system sans-serif font.

---

# 15. Photo Editing

Users should be able to:

- Crop
- Rotate
- Add text
- Add emoji
- Add stickers
- Draw
- Apply basic filters
- Add music where supported
- Add caption

### Crop ratios

```text
Original
1:1
4:5
9:16
16:9
```

The Status composition should prioritize a vertical 9:16 presentation.

---

# 16. Video Selection & Trimming

After selecting a video, show a thumbnail timeline.

```text
┌───────────────────────────────────┐
│           VIDEO PREVIEW           │
└───────────────────────────────────┘

0:00                                  1:00
│--------------------------------------│
     ▲                         ▲
   Start                       End

[████████████████████░░░░░░░░░]
```

### Requirements

- Thumbnail timeline
- Start handle
- End handle
- Playhead
- Play/pause
- Current timestamp
- Selected duration
- Reset
- Preview selected section

### Interactions

- Drag left handle → change start.
- Drag right handle → change end.
- Drag selected region → move complete selection.
- Tap timeline → move playhead.
- Play → preview selected portion.

Example:

```text
Start: 00:12
End:   00:27
Length: 00:15
```

The editor should prevent invalid ranges and preserve audio/video synchronization.

---

# 17. Video Portion Selector — Web

Desktop has more room for a larger timeline:

```text
00:00                                                    02:35
│----------------------------------------------------------│

        ┌──────────────────────────────┐
        │        Selected Video        │
        └──────────────────────────────┘
        ▲                              ▲
      Start                            End

[▶] [⏸] [↶] [↷] [Reset]
```

The timeline should support mouse drag, keyboard accessibility, and smooth scrubbing where technically feasible.

---

# 18. Music / Song Selector

Music should be available from the editor through a clearly visible Music action.

```text
┌─────────────────────────────────┐
│ Music                           │
│                                 │
│ 🔍 Search songs                 │
│                                 │
│ Recommended                    │
│ ────────────────────────────── │
│ ▶ Song One        Artist        │
│ ▶ Song Two        Artist        │
│ ▶ Song Three      Artist        │
│                                 │
│ Genres                          │
│ Trending  Chill  Travel  Party │
└─────────────────────────────────┘
```

### Music library features

- Search
- Recommended
- Recently used
- Categories/genres
- Track title
- Artist
- Duration
- Preview
- Select/use track
- Favorites where supported

Music must be limited to content the product is authorized to provide.

---

# 19. Song Preview

When a track is selected:

```text
┌─────────────────────────────────┐
│ ← Track Name                    │
│   Artist Name                   │
│                                 │
│              ▶                  │
│                                 │
│ 00:00 ───────────────── 03:42   │
│                                 │
│            [Use Song]           │
└─────────────────────────────────┘
```

The user should be able to listen before applying the track.

---

# 20. Song Portion Selector

The user should select the exact part of a song.

```text
0:00                                      3:45
│------------------------------------------│

       ┌───────────────────┐
       │ Selected Portion  │
       └───────────────────┘
       ▲                   ▲
     Start                 End

Start: 00:42
End:   00:57
Length: 00:15
```

### Interactions

- Drag start handle.
- Drag end handle.
- Drag selected region.
- Play selected section.
- Loop selected section.
- Reset selection.
- Show timestamps.

---

# 21. Video + Music Synchronization

```text
VIDEO
0:00 ───────────────── 00:30
      [Selected 15 sec]

MUSIC
0:00 ───────────────── 03:45
           [Selected 15 sec]
```

The system should combine the selected video range and selected audio range.

The preview must use the same timing that will be exported.

---

# 22. Audio Mixing

If the video has original audio:

```text
Original Video Audio
🔊 ───────────────── 70%

Added Music
🎵 ───────────────── 80%
```

Controls:

- Video volume
- Music volume
- Mute video audio
- Mute music
- Preview mix

The final exported result must reflect the selected mix.

---

# 23. Image + Music

For an image Status:

```text
Photo
  +
Music Track
  +
Selected Audio Segment
  ↓
Generated Media Composition
  ↓
Preview
  ↓
Publish
```

The implementation should use only supported and licensed audio.

---

# 24. Text Status

```text
┌───────────────────────────────┐
│                               │
│       Write your Status...    │
│                               │
│                               │
│   Aa       😊       🎨        │
│                               │
│                         ✓     │
└───────────────────────────────┘
```

Controls:

- Font
- Text size
- Alignment
- Background
- Text color
- Emoji
- Formatting

---

# 25. Text Overlay

Users should be able to:

- Drag text
- Resize text
- Rotate where supported
- Change color
- Change style
- Delete text

```text
┌───────────────────────────────┐
│                               │
│       Summer Trip 🌴          │
│                               │
│          PHOTO                │
│                               │
└───────────────────────────────┘
```

---

# 26. Emoji and Sticker Tools

Emoji picker:

```text
Search
😀 😃 😄 😁 😂 🤣
❤️ 💕 💯 🔥 ✨ 🌟
```

Stickers:

```text
😀  ❤️  🔥  🎉
⭐  😂  😎  👍
```

Objects should support drag, resize, rotate, and delete where applicable.

---

# 27. Drawing Tool

```text
Draw
────────────────
Pen
Color
Stroke Size
Undo
Redo
Eraser
```

Drawing should be non-destructive until export.

---

# 28. Filters

Optional lightweight filters:

```text
Original
Warm
Cool
Bright
Mono
Vintage
```

Filters should have live previews where device/browser performance allows.

---

# 29. Caption

Final media screen:

```text
┌───────────────────────────────┐
│                               │
│         MEDIA PREVIEW         │
│                               │
│ Add a caption...         😊   │
│                               │
│                         Send  │
└───────────────────────────────┘
```

Caption limits should be configurable.

---

# 30. Mentions

Where supported:

```text
@Rahul
```

Requirements:

- Search contacts while typing.
- Show matching users.
- Insert mention.
- Apply privacy rules.
- Handle invalid/deleted contacts.

---

# 31. Privacy Selector

```text
Status Privacy

◉ My Contacts

○ My Contacts Except...

○ Only Share With...
```

Web version:

```text
┌──────────────────────────────────┐
│ Status privacy                   │
│                                  │
│ ◉ My contacts                    │
│ ○ My contacts except...          │
│ ○ Only share with...             │
│                                  │
│                     [Save]       │
└──────────────────────────────────┘
```

Privacy must be enforced server-side.

---

# 32. Final Preview

The final screen combines:

- Media
- Video trim
- Audio
- Text
- Stickers
- Caption
- Privacy

```text
┌─────────────────────────────────┐
│ ←                               │
│                                 │
│          FINAL PREVIEW          │
│                                 │
│          🎵 Music               │
│                                 │
│ Caption...                      │
│                                 │
│                         Send ➤  │
└─────────────────────────────────┘
```

---

# 33. Upload States

## Pending

```text
Waiting to upload...
```

## Uploading

```text
Uploading 72%
██████████████░░░░
```

## Processing

```text
Upload complete ✓
Processing your Status...
████████████░░░░
```

## Success

```text
✓ Status posted
```

## Failure

```text
⚠ Upload failed
[Retry]
```

---

# 34. Offline Handling

If connectivity disappears:

```text
Upload paused

No internet connection.

[Retry]
```

Requirements:

- Preserve composition where possible.
- Avoid duplicate Status creation.
- Retry after reconnect.
- Resume upload where technically supported.
- Clearly explain unrecoverable failures.

---

# 35. Drafts

If draft support is enabled, preserve:

- Media reference
- Video trim range
- Audio track
- Audio trim range
- Caption
- Text
- Stickers
- Drawings
- Filters
- Privacy selection

Back action:

```text
Discard changes?

[Keep Editing] [Discard]
```

or:

```text
Save draft?

[Save Draft] [Discard]
```

---

# 36. Web Editor

The Web editor should use the larger screen:

```text
┌─────────────────────────────────────────────────────────┐
│ ← Back                                     Publish      │
├────────────────┬───────────────────────┬────────────────┤
│ Tools          │       Preview         │ Properties     │
│                │                       │                │
│ Crop           │       MEDIA           │ Caption        │
│ Rotate         │                       │ Music          │
│ Text           │                       │ Audio          │
│ Emoji          │                       │ Privacy        │
│ Sticker        │                       │                │
│ Draw           │                       │                │
│ Music          │                       │                │
├────────────────┴───────────────────────┴────────────────┤
│                 Video / Audio Timeline                  │
└─────────────────────────────────────────────────────────┘
```

---

# 37. Responsive Behavior

### Mobile < 640px

- Full-screen editor
- Bottom sheets
- Large touch controls
- Minimal secondary UI

### Tablet 640–1024px

- Full-screen or two-panel editor
- Larger timeline

### Desktop > 1024px

- Three-panel editor
- Large timeline
- Drag-and-drop
- Keyboard shortcuts

---

# 38. Accessibility

Requirements:

- Screen-reader labels
- Keyboard navigation
- Visible focus
- Sufficient contrast
- Accessible errors
- Reduced motion
- Non-color status indicators
- Large touch targets
- Keyboard-accessible Web timeline

Example:

```text
"Video start position, 12 seconds"
```

instead of simply:

```text
"Handle"
```

---

# 39. Web Keyboard Shortcuts

| Shortcut | Action |
|---|---|
| Space | Play/Pause |
| Ctrl/Cmd + Z | Undo |
| Ctrl/Cmd + Shift + Z | Redo |
| Esc | Close modal |
| Delete | Delete selected object |
| Arrow keys | Move selected object |
| Enter | Confirm action |

Shortcuts must not interfere with text input.

---

# 40. Status Viewer

```text
┌───────────────────────────────┐
│ User Name          12:30 PM   │
│                               │
│                               │
│          STATUS MEDIA         │
│                               │
│                               │
│                               │
│                         ⋮     │
│                               │
│ Reply...                      │
└───────────────────────────────┘
```

For multiple Status items, use segmented progress indicators.

```text
████████ | ░░░░░░ | ░░░░░░
```

---

# 41. Status Lifecycle

```text
DRAFT
 ↓
EDITING
 ↓
PREVIEW
 ↓
VALIDATING
 ↓
UPLOADING
 ↓
PROCESSING
 ↓
PUBLISHED
 ├──→ DELETED
 └──→ EXPIRED

UPLOADING
 ↓
FAILED
 ↓
RETRY
 ↓
UPLOADING
```

Default lifecycle:

```text
Published → Available for 24 hours → Expired
```

Server-side expiration should be authoritative.

---

# 42. Mobile/Web Synchronization

```text
Mobile
   │
   │ Publish
   ↓
Backend
   ├────────→ Mobile
   └────────→ Web
```

Synchronization should cover:

- Published Status
- Caption
- Privacy
- Deletion
- Expiration
- Viewer state where applicable

Server state should be authoritative during conflicts.

---

# 43. Conceptual Data Model

## Status

```text
Status
--------------------------------
id
user_id
type
media_id
caption
privacy_type
created_at
expires_at
status
```

## Media

```text
Media
--------------------------------
id
owner_id
type
mime_type
size
duration
width
height
storage_reference
processing_status
created_at
```

## Video Selection

```text
VideoSelection
--------------------------------
status_id
start_time
end_time
original_duration
```

## Audio Selection

```text
AudioSelection
--------------------------------
status_id
track_id
start_time
end_time
volume
```

---

# 44. Backend Processing

```text
Original Media
      ↓
Validation
      ↓
Media Decoder
      ↓
Video Trim
      ↓
Audio Selection
      ↓
Audio Mixing
      ↓
Text / Sticker Composition
      ↓
Encoding
      ↓
Compression
      ↓
Encryption
      ↓
Storage
      ↓
Publish
```

Original files should not be destructively modified during editing.

---

# 45. Upload Architecture

```text
Client
 ↓
Validate
 ↓
Create Upload Session
 ↓
Chunk / Stream Upload
 ↓
Verification
 ↓
Media Processing
 ↓
Secure Storage
 ↓
Status Record
 ↓
Publish
```

For large media, resumable uploads should be considered.

---

# 46. API Requirements

Conceptual endpoints:

### Create Upload

```http
POST /api/status/uploads
```

```json
{
  "type": "video",
  "fileName": "travel.mp4",
  "mimeType": "video/mp4",
  "size": 18400000
}
```

### Upload

```http
PUT /api/status/uploads/{uploadId}
```

### Process

```http
POST /api/status/uploads/{uploadId}/process
```

```json
{
  "videoStart": 12,
  "videoEnd": 27,
  "audioStart": 42,
  "audioEnd": 57,
  "videoVolume": 0.2,
  "musicVolume": 0.8
}
```

### Publish

```http
POST /api/status
```

```json
{
  "uploadId": "upload_123",
  "caption": "Amazing evening",
  "privacy": {
    "type": "contacts"
  }
}
```

### Read

```http
GET /api/status
GET /api/status/me
```

### Delete

```http
DELETE /api/status/{statusId}
```

### Retry

```http
POST /api/status/uploads/{uploadId}/retry
```

---

# 47. Suggested Frontend Component Structure

## Mobile

```text
StatusScreen
├── MyStatusCard
├── StatusList
├── StatusCreator
├── Camera
├── MediaPicker
├── StatusEditor
│   ├── MediaPreview
│   ├── VideoTimeline
│   ├── MusicSelector
│   ├── AudioTimeline
│   ├── TextEditor
│   ├── EmojiPicker
│   ├── StickerPicker
│   ├── DrawingTool
│   └── CaptionInput
├── PrivacySelector
├── StatusPreview
└── UploadProgress
```

## Web

```text
UpdatesPage
├── MyStatusCard
├── StatusList
└── StatusCreator
    ├── FilePicker
    ├── Editor
    │   ├── ToolPanel
    │   ├── PreviewPanel
    │   ├── PropertiesPanel
    │   ├── VideoTimeline
    │   └── AudioTimeline
    ├── PrivacyModal
    └── UploadManager
```

---

# 48. Error Handling

| Error | Message | Action |
|---|---|---|
| No Internet | No internet connection | Retry |
| Invalid File | This file type is not supported | Choose another |
| Large File | This file is too large | Choose another |
| Processing Failed | We couldn't process this media | Try again |
| Upload Failed | Status upload failed | Retry |
| Session Expired | Please reconnect | Reconnect |
| Server Error | Something went wrong | Retry later |
| Music Unavailable | This song isn't available | Choose another |
| Region Restriction | This song isn't available in your region | Choose another |

---

# 49. Music Licensing

Music is a separate product dependency.

The system must:

- Use music the product is authorized to provide.
- Respect geographic restrictions.
- Handle unavailable tracks.
- Respect licensing changes.
- Prevent unsupported copyrighted-audio workflows.
- Communicate unavailable tracks clearly.

Example:

```text
This song isn't available in your region.

[Choose Another Song]
```

---

# 50. Media Validation

Validate:

### File

- MIME type
- File size
- File integrity
- Dimensions
- Duration
- Codec where required

### Video

- Duration
- Resolution
- Audio codec
- Video codec
- Corruption

### Audio

- Duration
- Format
- Codec
- File size
- Availability/licensing

---

# 51. Performance Requirements

### Mobile

- Fast media preview.
- Smooth timeline scrubbing where hardware allows.
- No unnecessary UI freezing.
- Efficient upload.
- Graceful background behavior.

### Web

- Responsive editor.
- Efficient browser memory usage.
- Large-file handling.
- Non-blocking processing where possible.
- Smooth timeline interaction.

---

# 52. Security & Privacy

Requirements:

- Authenticate every user.
- Authorize every Status operation.
- Secure upload.
- Encrypt data in transit.
- Securely store media.
- Enforce privacy server-side.
- Prevent unauthorized media access.
- Validate all uploaded files.
- Secure deletion and expiration.
- Do not expose private metadata unnecessarily.

---

# 53. Analytics

Suggested events:

```text
status_create_started
status_camera_opened
status_gallery_opened
status_media_selected
status_editor_opened
status_video_trimmed
status_music_opened
status_music_searched
status_music_selected
status_audio_trimmed
status_text_added
status_emoji_added
status_sticker_added
status_drawing_used
status_preview_opened
status_privacy_changed
status_upload_started
status_upload_completed
status_upload_failed
status_upload_retried
status_published
status_deleted
status_expired
```

Analytics should avoid unnecessary collection of private Status content.

---

# 54. QA Test Plan

## Photo

- JPG
- PNG
- Large image
- Unsupported image
- Crop
- Rotate
- Text
- Emoji
- Sticker
- Music

## Video

- Short video
- Long video
- Trim beginning
- Trim end
- Move selection
- Preview selected portion
- Music selection
- Audio trim
- Audio mix
- Export

## Music

- Search
- Preview
- Select
- Trim
- Move selection
- Volume
- Unavailable song
- Regional restriction

## Web

- File picker
- Drag/drop
- Keyboard navigation
- Keyboard shortcuts
- Browser refresh
- Tab close
- Large media
- Different browsers

## Network

- Slow connection
- Disconnect during upload
- Reconnect
- Retry
- Duplicate prevention

---

# 55. Edge Cases

1. App closes during upload.
2. Browser closes during upload.
3. Wi-Fi changes to mobile data.
4. Network disappears.
5. File is deleted while editing.
6. Corrupt video.
7. Unsupported audio codec.
8. Music becomes unavailable.
9. Music is unavailable in a region.
10. Video has no audio.
11. User selects invalid trim range.
12. User selects invalid audio range.
13. User logs out during upload.
14. Authentication expires.
15. User opens draft on another device.
16. User publishes repeatedly.
17. Device storage is full.
18. Browser memory is insufficient.
19. Processing fails.
20. Backend is temporarily unavailable.
21. Status expires while being viewed.
22. Status is deleted from another device.

---

# 56. Acceptance Criteria

### Photo

Given a supported image, when the user edits and publishes it, the image becomes an active Status for the selected audience.

### Video Trim

Given a selected video, when the user changes start/end handles, only the selected range is included in the final composition.

### Music

Given an available licensed track, when the user selects a start/end range, the selected segment is used.

### Video + Music

Given a video and music track, the final composition uses the configured video and audio ranges.

### Audio Mix

Given original video audio and music, the final result follows the selected volume settings.

### Privacy

Only users permitted by the selected audience can access the Status.

### Retry

A failed upload can be retried without unnecessarily losing the composition.

### Web

A supported Web upload publishes and synchronizes with the user's account.

### Expiration

An expired Status no longer appears as an active Status.

---

# 57. Definition of Done

- [ ] Photo upload
- [ ] Video upload
- [ ] Text Status
- [ ] Mobile editor
- [ ] Web editor
- [ ] Video timeline
- [ ] Video start/end selector
- [ ] Music search
- [ ] Music preview
- [ ] Song portion selector
- [ ] Audio/video synchronization
- [ ] Audio volume
- [ ] Text overlay
- [ ] Emoji
- [ ] Stickers
- [ ] Drawing
- [ ] Crop/rotate
- [ ] Caption
- [ ] Privacy
- [ ] Preview
- [ ] Upload progress
- [ ] Retry
- [ ] Offline handling
- [ ] Drafts where enabled
- [ ] Delete
- [ ] Expiration
- [ ] Cross-device synchronization
- [ ] Accessibility
- [ ] Security testing
- [ ] Performance testing
- [ ] Browser testing
- [ ] Regression testing

---

# 58. Release Plan

## Phase 1 — Core Status

- Photo
- Video
- Text
- Caption
- Preview
- Privacy
- Upload
- Expiration

## Phase 2 — Editing

- Crop
- Rotate
- Text overlay
- Emoji
- Stickers
- Drawing
- Video trim

## Phase 3 — Music

- Music library
- Search
- Preview
- Track selection
- Song portion selector
- Audio trim
- Video/audio synchronization
- Volume controls

## Phase 4 — Reliability & Advanced UX

- Drafts
- Resumable upload
- Improved Web editor
- Keyboard shortcuts
- Better recovery
- Performance optimization

---

# 59. Final UX Flow

```text
                         STATUS
                            │
              ┌─────────────┴─────────────┐
              │                           │
            MOBILE                       WEB
              │                           │
       Camera / Gallery              File Picker
              │                           │
              └─────────────┬─────────────┘
                            ↓
                       MEDIA EDITOR
                            │
             ┌──────────────┼──────────────┐
             ↓              ↓              ↓
           VIDEO           AUDIO          VISUAL
           TRIM            MUSIC          EDITING
             │              │              │
             │         SONG SELECT        │
             │              │        Text/Emoji
             │         AUDIO TRIM      Stickers/Draw
             │              │        Crop/Rotate
             └──────────────┼──────────────┘
                            ↓
                         PREVIEW
                            ↓
                    CAPTION / MENTION
                            ↓
                         PRIVACY
                            ↓
                        VALIDATE
                            ↓
                         UPLOAD
                            ↓
                       PROCESSING
                            ↓
                         PUBLISH
                            ↓
                          VIEW
                            ↓
                        EXPIRE
```

---

# 60. Final Product Principles

1. **Simple by default** — basic Status should require minimal steps.
2. **Powerful when needed** — trimming, music, text, stickers, and drawing should be available without overwhelming beginners.
3. **Mobile-first** — touch and gesture interaction are primary on phones.
4. **Web-optimized** — desktop gets larger previews, timelines, drag/drop, mouse controls, and keyboard support.
5. **Privacy-first** — audience selection is visible and enforced server-side.
6. **Non-destructive editing** — editing should not destroy the original media before final export.
7. **Reliable uploads** — retries and recovery are built into the workflow.
8. **Clear feedback** — upload and processing states are always visible.
9. **Accessible** — keyboard, screen reader, contrast, reduced-motion, and touch requirements are addressed.
10. **Licensing-aware** — music availability depends on applicable rights and regional rules.
11. **Consistent behavior** — Mobile and Web share the same core product rules.
12. **Platform-aware UI** — the interaction design should be adapted to each device rather than forcing identical layouts.

---

# 61. Summary

This feature should be treated as a complete **Status Creation Studio**, not merely a file upload.

The full product experience is:

```text
CREATE
 ↓
SELECT/CAPTURE
 ↓
EDIT
 ├── Crop
 ├── Rotate
 ├── Text
 ├── Emoji
 ├── Stickers
 ├── Draw
 └── Filters
 ↓
VIDEO PORTION SELECTOR
 ↓
MUSIC SELECTOR
 ↓
SONG PORTION SELECTOR
 ↓
AUDIO MIX
 ↓
PREVIEW
 ↓
CAPTION
 ↓
PRIVACY
 ↓
UPLOAD
 ↓
PROCESS
 ↓
PUBLISH
 ↓
SYNC
 ↓
VIEW
 ↓
EXPIRE
```

The Mobile experience should emphasize camera, gallery, gestures, bottom sheets, and full-screen editing. The Web experience should emphasize file selection, drag-and-drop, larger media previews, multi-panel editing, detailed timelines, mouse controls, and keyboard accessibility.

The result should feel familiar to users of modern messaging apps while being implemented as a well-defined, responsive, privacy-conscious product.
