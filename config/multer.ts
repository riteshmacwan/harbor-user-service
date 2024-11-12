import multer from "multer";

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, "./temp");
  },
  filename: function (req, file, cb) {
    const fileSuffix = req.body.user_id;
    cb(null, fileSuffix + "-" + file.originalname);
  },
});
const fileFilter = (req, file, cb) => {
  const allowedTypes = [
    "image/jpeg",
    "image/jpeg",
    "application/pdf",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  ];
  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error("Only JPEG, PDF, and DOCX files are allowed"), false);
  }
};
export const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 },
});
