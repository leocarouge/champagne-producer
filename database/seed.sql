-- ============================================================
-- Seed data — Champagne Carouge-Cireddu
-- 6 rue de l'Église, Flavigny, 51190
-- champagnecarougecireddu@gmail.com | 06 77 95 90 62
-- ============================================================

-- Products
-- ⚠ Mettez à jour les prix selon votre tarif réel
INSERT INTO products (name, slug, description, price, stock, image_url, category, featured) VALUES
(
  'Champagne Sélection',
  'selection',
  'Notre cuvée emblématique, fruit d''un assemblage soigné de cépages champenois cultivés à Flavigny. Robe or dorée aux reflets verts, bulles fines et persistantes. Nez généreux de brioche, de pomme mûre et de fleurs blanches. Bouche équilibrée, fraîche et longue en finale. La cuvée idéale pour toutes les occasions.',
  25.00,
  200,
  null,
  'brut',
  true
),
(
  'Champagne Rosé',
  'rose',
  'Un rosé de caractère élaboré avec passion sur notre domaine de Flavigny. Robe rose aux reflets saumonés, effervescence délicate. Nez expressif de fruits rouges — fraise, framboise — rehaussé d''une touche florale. Bouche ample et gourmande, parfaite à l''apéritif ou avec un dessert aux fruits.',
  27.00,
  150,
  null,
  'rosé',
  true
);

-- Rooms
-- ⚠ Mettez à jour les prix selon votre tarif réel
INSERT INTO rooms (name, slug, description, price_per_night, capacity, photos, amenities) VALUES
(
  'Suite familiale',
  'suite-familiale',
  'Notre suite familiale spacieuse avec 1 lit double + 1 lit simple et salle de bain privative. Idéale pour les familles, elle vous offre tout le confort nécessaire pour un séjour ressourçant au cœur du village de Flavigny, en plein vignoble champenois.',
  80.00,
  3,
  ARRAY[]::TEXT[],
  ARRAY['1 lit double', '1 lit simple', 'Salle de bain privative', 'Wi-Fi']
),
(
  'Chambre simple',
  'chambre-simple',
  'Une chambre douillette avec 1 lit double et salle de bain privative. Parfaite pour un séjour en couple à Flavigny, au calme, à deux pas des vignes et de la cave Carouge-Cireddu.',
  65.00,
  2,
  ARRAY[]::TEXT[],
  ARRAY['1 lit double', 'Salle de bain privative', 'Wi-Fi']
),
(
  'Logement complet',
  'logement-complet',
  '2 Suites familiales + 1 Chambre simple pour une capacité totale de 8 personnes. Accès au salon / salle à manger, cuisine équipée et jardin privatif. Idéal pour les réunions de famille, les groupes d''amis ou les séminaires dans un cadre champenois authentique.',
  200.00,
  8,
  ARRAY[]::TEXT[],
  ARRAY['2 Suites familiales', '1 Chambre simple', 'Salon / salle à manger', 'Cuisine équipée', 'Jardin privatif', 'Capacité 8 personnes', 'Wi-Fi']
);

-- Admin
INSERT INTO users (email, name, role) VALUES
('champagnecarougecireddu@gmail.com', 'Carouge-Cireddu', 'admin')
ON CONFLICT (email) DO NOTHING;
