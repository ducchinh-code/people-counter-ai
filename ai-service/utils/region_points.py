import cv2
import numpy as np
from pathlib import Path

# =====================================================
# PATH
# =====================================================

BASE_DIR = Path(__file__).resolve().parent.parent

VIDEO_PATH = BASE_DIR / "datasets" / "20250808_135344.mp4"

print("=" * 60)
print("Current file :", __file__)
print("BASE_DIR     :", BASE_DIR)
print("VIDEO_PATH   :", VIDEO_PATH)
print("Exists       :", VIDEO_PATH.exists())
print("=" * 60)

if not VIDEO_PATH.exists():
    print("ERROR: Video does not exist!")
    exit()

# =====================================================
# OPEN VIDEO
# =====================================================

cap = cv2.VideoCapture(str(VIDEO_PATH))

if not cap.isOpened():
    print("ERROR: OpenCV cannot open this video.")

    print("\nTry checking:")
    print("1. Is the video corrupted?")
    print("2. Can VLC/Windows Media Player open it?")
    print("3. OpenCV version:", cv2.__version__)

    exit()

ret, frame = cap.read()
cap.release()

if not ret:
    print("ERROR: Cannot read first frame.")
    exit()

height, width = frame.shape[:2]

print(f"Video Size: {width} x {height}")

# =====================================================
# ROI SELECTOR
# =====================================================

points = []


def mouse_callback(event, x, y, flags, param):

    if event == cv2.EVENT_LBUTTONDOWN:

        points.append((x, y))


cv2.namedWindow("ROI Selector", cv2.WINDOW_NORMAL)
cv2.resizeWindow("ROI Selector", width, height)
cv2.setMouseCallback("ROI Selector", mouse_callback)

while True:

    img = frame.copy()

    # Draw points
    for i, p in enumerate(points):

        cv2.circle(img, p, 5, (0, 0, 255), -1)

        cv2.putText(
            img,
            str(i + 1),
            (p[0] + 8, p[1] - 8),
            cv2.FONT_HERSHEY_SIMPLEX,
            0.6,
            (255, 255, 0),
            2,
        )

    # Draw polygon
    if len(points) >= 2:

        cv2.polylines(
            img,
            [np.array(points)],
            False,
            (0, 255, 0),
            2,
        )

    # Close polygon
    if len(points) >= 3:

        cv2.line(
            img,
            points[-1],
            points[0],
            (255, 0, 255),
            2,
        )

    cv2.putText(
        img,
        "Left Click:Add  Z:Undo  R:Reset  Enter:Finish",
        (20, 35),
        cv2.FONT_HERSHEY_SIMPLEX,
        0.7,
        (0, 255, 255),
        2,
    )

    cv2.imshow("ROI Selector", img)

    key = cv2.waitKey(20) & 0xFF

    if key in (13, 32):  # Enter / Space
        break

    elif key == ord("z"):

        if points:
            points.pop()

    elif key == ord("r"):

        points.clear()

    elif key == 27:

        points.clear()
        break

cv2.destroyAllWindows()

print("\nSelected Points")
print("-" * 40)
print(points)