-- 002_multi_image — allow multiple notice images (docs/07-DATABASE.md)
-- Run in Supabase SQL editor.

alter table announcements
  alter column original_image_url type text[]
  using (
    case
      when original_image_url is null then null
      else array[original_image_url]
    end
  );
