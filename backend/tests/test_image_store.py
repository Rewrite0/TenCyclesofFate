import base64
import os
import tempfile
import time
import unittest
from pathlib import Path
from unittest.mock import patch


class TestImageStore(unittest.IsolatedAsyncioTestCase):
    async def asyncSetUp(self) -> None:
        from backend.app import image_store

        self.image_store = image_store
        self.tmpdir = tempfile.TemporaryDirectory()
        self.image_dir = Path(self.tmpdir.name) / "generated_images"

        self.patches = [
            patch.object(image_store.settings, "GENERATED_IMAGE_DIR", str(self.image_dir)),
            patch.object(image_store.settings, "GENERATED_IMAGE_URL_PREFIX", "/generated-images"),
            patch.object(image_store.settings, "GENERATED_IMAGE_RETENTION_SECONDS", 2 * 24 * 60 * 60),
            patch.object(image_store.settings, "GENERATED_IMAGE_CLEANUP_INTERVAL_SECONDS", 60 * 60),
        ]
        for p in self.patches:
            p.start()

        image_store._last_cleanup_at = 0.0

    async def asyncTearDown(self) -> None:
        for p in reversed(self.patches):
            p.stop()
        self.tmpdir.cleanup()
        self.image_store._last_cleanup_at = 0.0

    async def test_stores_base64_data_url_and_returns_relative_url(self):
        payload = b"fake png bytes"
        data_url = "data:image/png;base64," + base64.b64encode(payload).decode("ascii")

        url = await self.image_store.store_generated_image(data_url, player_id="user/name")

        self.assertTrue(url.startswith("/generated-images/"))
        self.assertTrue(url.endswith(".png"))
        files = list(self.image_dir.glob("*.png"))
        self.assertEqual(len(files), 1)
        self.assertEqual(files[0].read_bytes(), payload)
        self.assertIn("user_name", files[0].name)

    async def test_returns_non_data_urls_unchanged(self):
        url = "/already-stored/image.png"

        result = await self.image_store.store_generated_image(url, player_id="user")

        self.assertEqual(result, url)
        self.assertFalse(self.image_dir.exists())

    async def test_cleanup_removes_only_expired_images(self):
        self.image_dir.mkdir(parents=True)
        old_image = self.image_dir / "old.png"
        fresh_image = self.image_dir / "fresh.png"
        old_text = self.image_dir / "old.txt"

        old_image.write_bytes(b"old")
        fresh_image.write_bytes(b"fresh")
        old_text.write_text("leave me", encoding="utf-8")

        now = time.time()
        old_mtime = now - (3 * 24 * 60 * 60)
        fresh_mtime = now - 60
        os.utime(old_image, (old_mtime, old_mtime))
        os.utime(old_text, (old_mtime, old_mtime))
        os.utime(fresh_image, (fresh_mtime, fresh_mtime))

        removed = await self.image_store.cleanup_old_images(force=True)

        self.assertEqual(removed, 1)
        self.assertFalse(old_image.exists())
        self.assertTrue(fresh_image.exists())
        self.assertTrue(old_text.exists())
