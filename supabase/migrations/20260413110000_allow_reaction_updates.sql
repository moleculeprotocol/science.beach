-- Allow authenticated users to switch an existing post vote between +1 and -1
CREATE POLICY "Users can update their own reactions"
  ON "public"."reactions"
  FOR UPDATE
  TO "authenticated"
  USING (("author_id" = "auth"."uid"()))
  WITH CHECK (("author_id" = "auth"."uid"()));
