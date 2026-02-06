# Programming Concepts

## Design Patterns

### Creational Patterns
- **Singleton**: Ensure a class has only one instance
- **Factory**: Create objects without specifying exact class
- **Builder**: Construct complex objects step by step
- **Prototype**: Clone existing objects

### Structural Patterns
- **Adapter**: Allow incompatible interfaces to work together
- **Decorator**: Add behavior to objects dynamically
- **Facade**: Provide simple interface to complex subsystem
- **Proxy**: Provide placeholder for another object

### Behavioral Patterns
- **Observer**: Define subscription mechanism
- **Strategy**: Define family of algorithms
- **Command**: Encapsulate request as object
- **State**: Allow object to alter behavior when state changes

## SOLID Principles

### Single Responsibility
A class should have only one reason to change.

### Open/Closed
Software entities should be open for extension but closed for modification.

### Liskov Substitution
Objects of a superclass should be replaceable with objects of subclasses.

### Interface Segregation
Many client-specific interfaces are better than one general-purpose interface.

### Dependency Inversion
Depend on abstractions, not concretions.

## Data Structures

### Time Complexity Cheat Sheet
| Structure | Access | Search | Insert | Delete |
|-----------|--------|--------|--------|--------|
| Array | O(1) | O(n) | O(n) | O(n) |
| Linked List | O(n) | O(n) | O(1) | O(1) |
| Hash Table | N/A | O(1)* | O(1)* | O(1)* |
| BST | O(log n)* | O(log n)* | O(log n)* | O(log n)* |
| Heap | O(1) | O(n) | O(log n) | O(log n) |

*average case

## Algorithms

### Sorting
- **Quick Sort**: O(n log n) average, O(n²) worst
- **Merge Sort**: O(n log n) guaranteed, stable
- **Heap Sort**: O(n log n), in-place

### Searching
- **Binary Search**: O(log n), requires sorted array
- **BFS**: O(V + E), finds shortest path in unweighted graph
- **DFS**: O(V + E), uses less memory than BFS

---
Tags: #reference #programming #cs
