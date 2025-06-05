import router from "express";
import * as post_controller from "./post.controller.js";
import {
  error_handle,
  isAuthenticated,
  multer_host,
} from "../../middleware/index.js";
import { extensions } from "../../utils/index.js";
import fileAudioUpload from '../../utils/audioUpload.js'

const post_router = router();

post_router.post(
  "/add",
  isAuthenticated,
  multer_host({
    allowed_extensions: [
      ...extensions.images,
      ...extensions.documents,
      ...extensions.videos,
    ],
  }).array("files", 5),
  error_handle(post_controller.add_post)
);
post_router.get("/list", error_handle(post_controller.get_all_posts));
post_router.get(
  "/list_specific/:_id",
  error_handle(post_controller.get_specific_post)
);
post_router.put(
  "/update/:post_id",
  isAuthenticated,
  multer_host({
    allowed_extensions: [
      ...extensions.images,
      ...extensions.documents,
      ...extensions.videos,
    ],
  }).array("files", 5),
  error_handle(post_controller.update_post)
);
post_router.delete(
  "/delete/:post_id",
  isAuthenticated,
  error_handle(post_controller.delete_post)
);

post_router.get('/search', post_controller.searchByText); 
post_router.post('/search/audio', fileAudioUpload.single('audio'), error_handle(post_controller.searchByAudio));

export { post_router };
