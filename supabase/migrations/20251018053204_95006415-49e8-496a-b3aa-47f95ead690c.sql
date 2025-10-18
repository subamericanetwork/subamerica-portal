-- Fix existing data: amounts over 1000 cents ($10) are likely stored incorrectly (multiplied by 100)
-- These should be divided by 100 to get the correct cent amount
UPDATE tips
SET amount = amount / 100,
    artist_share = (amount / 100) * 0.80
WHERE amount > 1000;