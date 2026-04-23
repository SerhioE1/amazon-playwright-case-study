Feature: Amazon cheapest products
  # End-to-end shopping flow for cheapest candy products on Amazon.
  # Data-driven and reusable without duplicated steps.

  Background:
    Given the test framework is initialized

  Scenario: User adds multiple cheapest products to the cart
    When the user adds the cheapest products to the cart:
      | Snickers |
      | Skittles |
      | Twix     |
    And the user opens the cart
    Then the cart subtotal should match the sum of the selected product prices