ALTER TABLE "catalog_sections" DROP CONSTRAINT "catalog_sections_slug_unique";--> statement-breakpoint
ALTER TABLE "catalog_sections" ADD COLUMN "kind" text DEFAULT 'molds' NOT NULL;--> statement-breakpoint
ALTER TABLE "catalog_sections" ADD CONSTRAINT "catalog_sections_kind_slug_unique" UNIQUE("kind","slug");--> statement-breakpoint
INSERT INTO "catalog_sections" ("key", "slug", "name", "sort", "visible", "kind") VALUES
  ('tayyor_termopanel', 'thermal-panels', '{"uz":"Termopanellar","ru":"Термопанели","en":"Thermal panels"}', 110, true, 'ready'),
  ('tayyor_bilayn', 'beeline-panels', '{"uz":"Bilayn panellari","ru":"Панели «Билайн»","en":"Beeline panels"}', 120, true, 'ready'),
  ('tayyor_dekor', 'decor-panels', '{"uz":"Dekorativ panellar","ru":"Декоративные панели","en":"Decorative panels"}', 130, true, 'ready'),
  ('tayyor_karniz', 'cornices', '{"uz":"Karnizlar","ru":"Карнизы","en":"Cornices"}', 140, true, 'ready'),
  ('tayyor_tyaga', 'mouldings', '{"uz":"Tyagalar","ru":"Тяги","en":"Mouldings"}', 150, true, 'ready'),
  ('tayyor_pilyastra', 'pilasters', '{"uz":"Pilyastra va nalichniklar","ru":"Пилястры и наличники","en":"Pilasters and window trims"}', 160, true, 'ready'),
  ('tayyor_kapitel', 'capitals', '{"uz":"Kapitel va bazalar","ru":"Капители и базы","en":"Capitals and bases"}', 170, true, 'ready'),
  ('tayyor_tsokol', 'plinth', '{"uz":"Sokol elementlari","ru":"Цоколь","en":"Plinth elements"}', 180, true, 'ready'),
  ('tayyor_tosh', 'facade-stone', '{"uz":"Fasad toshi","ru":"Фасадный камень","en":"Facade stone"}', 190, true, 'ready'),
  ('tayyor_skameyka', 'benches', '{"uz":"Beton skameykalar","ru":"Бетонные скамейки","en":"Concrete benches"}', 200, true, 'ready'),
  ('tayyor_zabor', 'euro-fence', '{"uz":"Yevrozaborlar","ru":"Еврозаборы","en":"Euro fences"}', 210, true, 'ready')
ON CONFLICT ("key") DO NOTHING;
