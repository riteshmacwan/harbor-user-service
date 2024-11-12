import multer from "multer";
import path from "path";

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, "./temp");
  },
  filename: function (req, file, cb) {
    // const fileSuffix = req.body.user_id;
    // cb(null, fileSuffix + "-" + file.originalname);
    const userId = req.body.user_id || req.params.user_id; // Adjust according to how user_id is sent
    const fieldname = file.fieldname;
    const fileExtension = path.extname(file.originalname); // Get the file extension

    // Construct the custom file name
    const fileName = `${userId}-${fieldname}-${Date.now()}${fileExtension}`;

    cb(null, fileName);
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
