import cv2
from ultralytics import solutions

cap = cv2.VideoCapture("datasets/video/TownCentreXVID.mp4")
region_points = [(537, 266), (1850, 631)]

w, h, fps = (int(cap.get(x)) for x in (cv2.CAP_PROP_FRAME_WIDTH, cv2.CAP_PROP_FRAME_HEIGHT, cv2.CAP_PROP_FPS))
video_writer = cv2.VideoWriter("object_counting_output.avi", cv2.VideoWriter_fourcc(*"mp4v"), fps, (w, h))

counter = solutions.ObjectCounter(
    show=False,  # display the output
    region=region_points,  # pass region points
    model="yolo11n.pt",  # model="yolo26n-obb.pt" for object counting with OBB model.
    classes=[0],  # count specific classes, e.g., person and car with the COCO pretrained model.
    tracker="botsort.yaml"  # choose trackers, e.g., "bytetrack.yaml"
)
cv2.namedWindow("Counter", cv2.WINDOW_NORMAL)
cv2.resizeWindow("Counter", w, h)

while cap.isOpened():
    success, im0 = cap.read()

    if not success:
        print("Video frame is empty or processing is complete.")
        break

    results = counter(im0)


    cv2.imshow("Counter", results.plot_im)

    video_writer.write(results.plot_im)

    if cv2.waitKey(1) == 27:
        break
    print(results)  # access the output

cap.release()
video_writer.release()
cv2.destroyAllWindows()