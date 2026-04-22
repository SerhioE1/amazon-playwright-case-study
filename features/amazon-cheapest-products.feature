Feature: Amazon cheapest products
  # This feature describes the end-to-end shopping flow for cheapest candy products on Amazon.
  # It contains:
  # 1. A core scenario aligned with the original case study requirements.
  # 2. An extended scenario demonstrating that the test flow is expandable for more products.

  Scenario: User adds the cheapest Snickers and Skittles to the cart
    Given the test framework is initialized
    When the user searches for "Snickers"
    And the user opens the cheapest available product from the search results
    And the user adds the product to the cart

    When the user searches for "Skittles"
    And the user opens the cheapest available product from the search results
    And the user adds the product to the cart

    And the user opens the cart
    Then the cart subtotal should match the sum of the selected product prices

  Scenario: User adds several cheapest candy products to the cart
    Given the test framework is initialized
    When the user searches for "Snickers"
    And the user opens the cheapest available product from the search results
    And the user adds the product to the cart

    When the user searches for "Skittles"
    And the user opens the cheapest available product from the search results
    And the user adds the product to the cart

    When the user searches for "Twix"
    And the user opens the cheapest available product from the search results
    And the user adds the product to the cart

    When the user searches for "M&M's"
    And the user opens the cheapest available product from the search results
    And the user adds the product to the cart

    And the user opens the cart
    Then the cart subtotal should match the sum of the selected product prices