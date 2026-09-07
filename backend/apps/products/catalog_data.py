"""
MediSwift Healthcare Catalog Data Aggregator
Combines all 20 categories and 260 authentic healthcare and pharmacy products.
"""
from apps.products.catalog_data_part1 import CATEGORIES_PART_1, PRODUCTS_PART_1
from apps.products.catalog_data_part2 import PRODUCTS_PART_2
from apps.products.catalog_data_part3 import CATEGORIES_PART_2, PRODUCTS_PART_3
from apps.products.catalog_data_part4 import PRODUCTS_PART_4

ALL_CATEGORIES = CATEGORIES_PART_1 + CATEGORIES_PART_2
ALL_PRODUCTS = PRODUCTS_PART_1 + PRODUCTS_PART_2 + PRODUCTS_PART_3 + PRODUCTS_PART_4

assert len(ALL_CATEGORIES) == 20, f"Expected 20 categories, got {len(ALL_CATEGORIES)}"
assert len(ALL_PRODUCTS) == 260, f"Expected 260 products, got {len(ALL_PRODUCTS)}"
