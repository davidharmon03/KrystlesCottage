const bcrypt = require('bcryptjs');
const { v4: uuidv4 } = require('uuid');

async function _seed(db) {
  // Sample accounts share the password 'password123' — local development only,
  // never on the live site.
  if (process.env.NODE_ENV === 'production') return;
  const existing = await db.get('SELECT id FROM users LIMIT 1');
  if (existing) return;

  console.log('Seeding database...');
  const pw = bcrypt.hashSync('password123', 10);

  const krystle = { id: uuidv4(), name: 'Krystle', email: 'krystle@example.com', password: pw };
  const marcus = { id: uuidv4(), name: 'Marcus', email: 'marcus@example.com', password: pw };
  const dana = { id: uuidv4(), name: 'Dana', email: 'dana@example.com', password: pw };

  for (const u of [krystle, marcus, dana]) {
    await db.run('INSERT INTO users (id, name, email, password) VALUES (?,?,?,?)', [
      u.id,
      u.name,
      u.email,
      u.password,
    ]);
  }

  const group = {
    id: uuidv4(),
    name: "Krystle's Crew",
    invite_code: 'KREW2024',
    owner_id: krystle.id,
  };
  await db.run('INSERT INTO groups (id, name, invite_code, owner_id) VALUES (?,?,?,?)', [
    group.id,
    group.name,
    group.invite_code,
    group.owner_id,
  ]);
  for (const uid of [krystle.id, marcus.id, dana.id]) {
    await db.run('INSERT INTO group_members (id, group_id, user_id) VALUES (?,?,?)', [
      uuidv4(),
      group.id,
      uid,
    ]);
  }

  // Recipes
  const recipes = [
    {
      title: 'Flash-Frozen Garlic Herb Steak',
      description: 'Perfectly seasoned ribeye, flash frozen and vacuum sealed for the swap.',
      ingredients: JSON.stringify([
        '2 ribeye steaks',
        '4 cloves garlic',
        '2 tbsp fresh rosemary',
        '2 tbsp butter',
        'Salt & pepper',
      ]),
      steps: JSON.stringify([
        'Season steaks generously',
        'Sear 2 min per side in cast iron',
        'Baste with garlic butter',
        'Flash freeze 2h, then vacuum seal',
      ]),
      tags: JSON.stringify(['beef', 'freezer-friendly', 'high-protein']),
      skill_tags: JSON.stringify(['intermediate']),
    },
    {
      title: 'Roasted Tomato Basil Sauce',
      description: 'Garden-fresh tomatoes slow roasted into a rich sauce. Freezes beautifully.',
      ingredients: JSON.stringify([
        '2 lbs heirloom tomatoes',
        '1 head garlic',
        'Fresh basil',
        '1/4 cup olive oil',
        'Sea salt',
      ]),
      steps: JSON.stringify([
        'Halve tomatoes, roast at 375F for 45 min',
        'Blend with garlic and basil',
        'Simmer 10 min',
        'Portion and freeze',
      ]),
      tags: JSON.stringify(['vegetarian', 'garden', 'freezer-friendly']),
      skill_tags: JSON.stringify(['beginner']),
    },
    {
      title: 'Bone Broth Concentrate',
      description: 'Slow-simmered for 24h. Rich, gelatinous, and packed with minerals.',
      ingredients: JSON.stringify([
        '3 lbs mixed bones',
        '2 tbsp apple cider vinegar',
        'Bay leaves',
        'Peppercorns',
        'Filtered water',
      ]),
      steps: JSON.stringify([
        'Roast bones at 400F for 30 min',
        'Add all to slow cooker with water and ACV',
        'Cook on low 24h',
        'Strain and reduce by half, freeze in cubes',
      ]),
      tags: JSON.stringify(['keto', 'healing', 'freezer-friendly']),
      skill_tags: JSON.stringify(['beginner']),
    },
  ];
  for (const r of recipes) {
    await db.run(
      'INSERT INTO recipes (id,title,description,ingredients,steps,tags,skill_tags,author_id,group_id,is_public) VALUES (?,?,?,?,?,?,?,?,?,?)',
      [
        uuidv4(),
        r.title,
        r.description,
        r.ingredients,
        r.steps,
        r.tags,
        r.skill_tags,
        krystle.id,
        group.id,
        1,
      ]
    );
  }

  // Inventory
  const items = [
    {
      name: 'Grass-Fed Ribeye',
      quantity: '4 steaks',
      category: 'protein',
      storage_type: 'vacuum sealed',
      added_by: krystle.id,
    },
    {
      name: 'Heirloom Tomatoes',
      quantity: '2 lbs',
      category: 'produce',
      storage_type: 'fresh',
      added_by: krystle.id,
    },
    {
      name: 'Raw Honey',
      quantity: '1 qt jar',
      category: 'pantry',
      storage_type: 'pantry',
      added_by: marcus.id,
    },
    {
      name: 'Bone Broth',
      quantity: '8 cups',
      category: 'staple',
      storage_type: 'frozen',
      added_by: krystle.id,
    },
  ];
  for (const i of items) {
    await db.run(
      'INSERT INTO inventory_items (id,group_id,name,quantity,category,storage_type,added_by) VALUES (?,?,?,?,?,?,?)',
      [uuidv4(), group.id, i.name, i.quantity, i.category, i.storage_type, i.added_by]
    );
  }

  // Garden
  const plants = [
    {
      plant_name: 'Heirloom Tomatoes',
      date_planted: '2024-04-01',
      expected_harvest: '2024-07-15',
      status: 'growing',
      added_by: krystle.id,
    },
    {
      plant_name: 'Sweet Basil',
      date_planted: '2024-04-10',
      expected_harvest: '2024-06-01',
      status: 'harvesting',
      added_by: krystle.id,
    },
    {
      plant_name: 'Kale',
      date_planted: '2024-03-15',
      expected_harvest: '2024-05-30',
      status: 'harvested',
      added_by: dana.id,
    },
  ];
  for (const p of plants) {
    await db.run(
      'INSERT INTO garden_plants (id,group_id,plant_name,date_planted,expected_harvest,status,added_by) VALUES (?,?,?,?,?,?,?)',
      [uuidv4(), group.id, p.plant_name, p.date_planted, p.expected_harvest, p.status, p.added_by]
    );
  }

  // Receipts
  await db.run('INSERT INTO receipts (id,group_id,user_id,amount,description) VALUES (?,?,?,?,?)', [
    uuidv4(),
    group.id,
    krystle.id,
    87.5,
    'Whole Foods — proteins for the week',
  ]);
  await db.run('INSERT INTO receipts (id,group_id,user_id,amount,description) VALUES (?,?,?,?,?)', [
    uuidv4(),
    group.id,
    marcus.id,
    42.0,
    "Farmer's market haul",
  ]);

  // Equipment catalog
  const catalog = [
    {
      name: 'FoodSaver FM2000 Vacuum Sealer',
      category: 'hardware',
      brand: 'FoodSaver',
      description:
        'Compact automatic vacuum sealer. Removes air and seals bags to keep food fresh up to 5x longer. Essential for the meal swap program.',
      purchase_url: 'https://www.foodsaver.com',
      is_recommended: 1,
    },
    {
      name: 'Midea 7.0 Cu Ft Chest Freezer',
      category: 'hardware',
      brand: 'Midea',
      description:
        'Deep chest freezer ideal for storing large batch meals and proteins. Fits neatly in a garage or basement.',
      purchase_url: 'https://www.amazon.com',
      is_recommended: 1,
    },
    {
      name: 'DYMO LabelWriter 450',
      category: 'hardware',
      brand: 'DYMO',
      description:
        'Direct thermal label printer. No ink cartridges needed. Prints adhesive labels for vacuum bags, jars, and containers.',
      purchase_url: 'https://www.dymo.com',
      is_recommended: 1,
    },
    {
      name: 'Escali Primo Digital Kitchen Scale',
      category: 'hardware',
      brand: 'Escali',
      description:
        'Accurate to 1g, 11 lb capacity. Essential for portioning recipes consistently across the group.',
      purchase_url: 'https://www.amazon.com',
      is_recommended: 1,
    },
    {
      name: 'Pyrex Simply Store 18-pc Glass Set',
      category: 'storage_containers',
      brand: 'Pyrex',
      description:
        'The standard uniform container fleet. Borosilicate glass, freezer-to-oven safe. Standardizing on these ensures lids are interchangeable across all 5 households.',
      purchase_url: 'https://www.amazon.com',
      is_recommended: 1,
    },
    {
      name: 'Ball Wide-Mouth Mason Jars 32oz (12-pk)',
      category: 'storage_containers',
      brand: 'Ball',
      description:
        'Wide-mouth quart jars for soups, broths, sauces, and dry goods. Stackable and airtight.',
      purchase_url: 'https://www.amazon.com',
      is_recommended: 1,
    },
    {
      name: 'OXO Good Grips 10-pc POP Container Set',
      category: 'storage_containers',
      brand: 'OXO',
      description:
        'Airtight push-to-open containers for pantry staples — grains, flours, nuts. Stackable with uniform footprint.',
      purchase_url: 'https://www.oxo.com',
      is_recommended: 0,
    },
    {
      name: 'FoodSaver Gallon Vacuum Bags (28-pk)',
      category: 'expendables',
      brand: 'FoodSaver',
      description:
        'BPA-free vacuum seal bags compatible with FoodSaver and most channel-style sealers. Reusable up to 3x if contents were dry.',
      purchase_url: 'https://www.foodsaver.com',
      is_recommended: 1,
    },
    {
      name: 'Reynolds Wrap Unbleached Parchment Paper (100 sq ft)',
      category: 'expendables',
      brand: 'Reynolds',
      description:
        'Unbleached, non-stick parchment for flash-freezing individual portions before vacuum sealing. Prevents items from sticking together.',
      purchase_url: 'https://www.amazon.com',
      is_recommended: 1,
    },
    {
      name: 'Ziploc Freezer Bags Gallon (30-pk)',
      category: 'expendables',
      brand: 'Ziploc',
      description:
        "Heavy-duty freezer bags for items that don't require a full vacuum seal. Double zipper, BPA-free.",
      purchase_url: 'https://www.amazon.com',
      is_recommended: 0,
    },
    {
      name: 'Avery Removable Square Labels 2" (60-pk)',
      category: 'expendables',
      brand: 'Avery',
      description:
        'White removable labels that peel cleanly off glass and plastic. Ideal for dating and labeling containers in the rotation fleet.',
      purchase_url: 'https://www.avery.com',
      is_recommended: 1,
    },
    {
      name: 'Sharpie Fine-Tip Permanent Markers (12-pk)',
      category: 'expendables',
      brand: 'Sharpie',
      description:
        'For writing directly on vacuum bags — date, contents, cook instructions. Fine tip fits the label area on standard bags.',
      purchase_url: 'https://www.amazon.com',
      is_recommended: 0,
    },
  ];
  for (const c of catalog) {
    await db.run(
      'INSERT INTO equipment_catalog (id,name,category,brand,description,image_url,purchase_url,is_recommended) VALUES (?,?,?,?,?,?,?,?)',
      [
        uuidv4(),
        c.name,
        c.category,
        c.brand || '',
        c.description || '',
        c.image_url || '',
        c.purchase_url || '',
        c.is_recommended,
      ]
    );
  }

  // Seed group equipment from catalog items
  const foodsaver = await db.get(
    "SELECT id FROM equipment_catalog WHERE name LIKE '%FoodSaver FM2000%'"
  );
  const pyrex = await db.get("SELECT id FROM equipment_catalog WHERE name LIKE '%Pyrex%'");
  const scale = await db.get("SELECT id FROM equipment_catalog WHERE name LIKE '%Escali%'");
  if (foodsaver) {
    await db.run(
      'INSERT INTO group_equipment (id,group_id,catalog_item_id,quantity,owner_user_id,condition,notes) VALUES (?,?,?,?,?,?,?)',
      [uuidv4(), group.id, foodsaver.id, 1, krystle.id, 'good', 'Bought March 2024, works great']
    );
  }
  if (pyrex) {
    await db.run(
      'INSERT INTO group_equipment (id,group_id,catalog_item_id,quantity,owner_user_id,condition,notes) VALUES (?,?,?,?,?,?,?)',
      [uuidv4(), group.id, pyrex.id, 2, krystle.id, 'good', '2 full sets — enough for rotation']
    );
    await db.run(
      'INSERT INTO group_equipment (id,group_id,catalog_item_id,quantity,owner_user_id,condition,notes) VALUES (?,?,?,?,?,?,?)',
      [uuidv4(), group.id, pyrex.id, 1, marcus.id, 'fair', 'Missing 2 lids']
    );
  }
  if (scale) {
    await db.run(
      'INSERT INTO group_equipment (id,group_id,catalog_item_id,quantity,owner_user_id,condition,notes) VALUES (?,?,?,?,?,?,?)',
      [uuidv4(), group.id, scale.id, 1, dana.id, 'good', '']
    );
  }

  // Seed standard container reference list
  await db.run(
    'INSERT INTO container_fleet (id,group_id,container_type,supply_type,size_capacity,material,description,purchase_url) VALUES (?,?,?,?,?,?,?,?)',
    [
      uuidv4(),
      group.id,
      '32oz Pyrex Glass Meal Prep Container',
      'container',
      '32 oz',
      'Borosilicate Glass',
      'Standard entrée container for the meal swap rotation. Freezer-to-oven safe, lids are interchangeable across sets.',
      'https://www.amazon.com/s?k=pyrex+simply+store+glass',
    ]
  );
  await db.run(
    'INSERT INTO container_fleet (id,group_id,container_type,supply_type,size_capacity,material,description,purchase_url) VALUES (?,?,?,?,?,?,?,?)',
    [
      uuidv4(),
      group.id,
      'Quart Wide-Mouth Mason Jar',
      'container',
      '1 qt / 32 oz',
      'Glass',
      'For soups, broths, and sauces. Wide-mouth Ball jars — all couples should use same brand so lids work across households.',
      'https://www.amazon.com/s?k=ball+wide+mouth+mason+jar+quart',
    ]
  );
  await db.run(
    'INSERT INTO container_fleet (id,group_id,container_type,supply_type,size_capacity,material,description,purchase_url) VALUES (?,?,?,?,?,?,?,?)',
    [
      uuidv4(),
      group.id,
      'Gallon FoodSaver Vacuum Bag',
      'consumable',
      '1 gallon',
      'BPA-Free Plastic',
      'For large protein cuts, bulk grains, and anything that benefits from full vacuum sealing.',
      'https://www.foodsaver.com',
    ]
  );

  // Consumable standard supplies
  const consumables = [
    {
      container_type: 'Reynolds Unbleached Parchment Paper',
      size_capacity: '100 sq ft roll',
      material: 'Unbleached Paper',
      description:
        'For flash-freezing individual portions before vacuum sealing. Prevents sticking. Everyone should keep a roll.',
      purchase_url: 'https://www.amazon.com/s?k=reynolds+unbleached+parchment+paper',
    },
    {
      container_type: 'Ziploc Freezer Bags (Gallon, 30-pk)',
      size_capacity: '1 gallon',
      material: 'BPA-Free Plastic',
      description:
        "For items that don't need a full vacuum seal. Double-seal zipper. Standard gallon size only — no quart bags in the rotation to keep labeling consistent.",
      purchase_url: 'https://www.amazon.com/s?k=ziploc+freezer+bags+gallon',
    },
    {
      container_type: 'Avery Removable Square Labels 2" (60-pk)',
      size_capacity: '2" x 2"',
      material: 'Paper / Adhesive',
      description:
        'Removable labels for dating containers. Peel cleanly off glass and plastic. Use for anything not going in the vacuum sealer.',
      purchase_url: 'https://www.avery.com',
    },
  ];
  for (const c of consumables) {
    await db.run(
      'INSERT INTO container_fleet (id,group_id,container_type,supply_type,size_capacity,material,description,purchase_url) VALUES (?,?,?,?,?,?,?,?)',
      [
        uuidv4(),
        group.id,
        c.container_type,
        'consumable',
        c.size_capacity,
        c.material,
        c.description,
        c.purchase_url,
      ]
    );
  }

  // Sample bulk buy run
  const runId = uuidv4();
  await db.run(
    'INSERT INTO bulk_buy_runs (id,group_id,name,run_date,buyer_user_id,status,created_by) VALUES (?,?,?,?,?,?,?)',
    [runId, group.id, "Sam's Club April Run", '2024-04-20', krystle.id, 'planning', krystle.id]
  );
  const bulkItems = [
    {
      item_name: 'Organic Garlic (3 lb bag)',
      category: 'produce',
      requested_by: krystle.id,
      quantity_needed: '2 bags',
      est_cost: 12.0,
    },
    {
      item_name: 'Extra Virgin Olive Oil (2 L)',
      category: 'condiment',
      requested_by: marcus.id,
      quantity_needed: '1 bottle',
      est_cost: 18.0,
    },
    {
      item_name: 'FoodSaver Gallon Bags (28-pk)',
      category: 'consumables',
      requested_by: krystle.id,
      quantity_needed: '2 boxes',
      est_cost: 28.0,
    },
    {
      item_name: 'FoodSaver Gallon Bags (28-pk)',
      category: 'consumables',
      requested_by: dana.id,
      quantity_needed: '1 box',
      est_cost: 14.0,
    },
    {
      item_name: 'Sea Salt (5 lb bag)',
      category: 'staple',
      requested_by: marcus.id,
      quantity_needed: '1 bag',
      est_cost: 8.0,
    },
  ];
  for (const bi of bulkItems) {
    await db.run(
      'INSERT INTO bulk_buy_items (id,run_id,group_id,item_name,category,requested_by,quantity_needed,est_cost) VALUES (?,?,?,?,?,?,?,?)',
      [
        uuidv4(),
        runId,
        group.id,
        bi.item_name,
        bi.category,
        bi.requested_by,
        bi.quantity_needed,
        bi.est_cost,
      ]
    );
  }

  console.log('Seed complete. Login: krystle@example.com / password123');
}

module.exports = _seed;
