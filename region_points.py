import cv2
import numpy as np

VIDEO_PATH = "datasets/video/TownCentreXVID.mp4"

points = []


def mouse_callback(event, x, y, flags, param):
    if event == cv2.EVENT_LBUTTONDOWN:
        points.append((x, y))


# Đọc frame đầu tiên
cap = cv2.VideoCapture(VIDEO_PATH)

if not cap.isOpened():
    print("Không thể mở video.")
    exit()

ret, frame = cap.read()
cap.release()

if not ret:
    print("Không đọc được frame đầu tiên.")
    exit()

height, width = frame.shape[:2]

print(f"Video size: {width} x {height}")

cv2.namedWindow("Select ROI", cv2.WINDOW_NORMAL)
cv2.resizeWindow("Select ROI", width, height)
cv2.setMouseCallback("Select ROI", mouse_callback)

while True:

    img = frame.copy()

    # Vẽ các điểm
    for i, p in enumerate(points):
        cv2.circle(img, p, 6, (0, 0, 255), -1)

        cv2.putText(
            img,
            str(i + 1),
            (p[0] + 8, p[1] - 8),
            cv2.FONT_HERSHEY_SIMPLEX,
            0.6,
            (255, 255, 0),
            2,
        )

    # Vẽ đường nối
    if len(points) >= 2:
        cv2.polylines(
            img,
            [np.array(points, dtype=np.int32)],
            False,
            (0, 255, 0),
            2,
        )

    # Đóng vùng khi có >=3 điểm
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
        "Left Click: Add Point | Z: Undo | R: Reset | Enter: Finish",
        (20, 40),
        cv2.FONT_HERSHEY_SIMPLEX,
        0.7,
        (0, 255, 255),
        2,
    )

    cv2.imshow("Select ROI", img)

    key = cv2.waitKey(20) & 0xFF

    # Enter hoặc Space
    if key in (13, 32):
        break

    # Undo
    elif key == ord("z"):
        if points:
            points.pop()

    # Reset
    elif key == ord("r"):
        points.clear()

    # ESC
    elif key == 27:
        points.clear()
        break

cv2.destroyAllWindows()

print("\nRegion Points:")
print(points)