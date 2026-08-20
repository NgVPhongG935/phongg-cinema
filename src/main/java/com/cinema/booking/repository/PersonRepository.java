package com.cinema.booking.repository;

import com.cinema.booking.document.Person;
import org.springframework.data.mongodb.repository.MongoRepository;

import java.util.List;
import java.util.Optional;

public interface PersonRepository extends MongoRepository<Person, String> {
    List<Person> findByNameContainingIgnoreCase(String name);
    Optional<Person> findByNameIgnoreCase(String name);
    boolean existsByNameIgnoreCase(String name);
    List<Person> findByRoleTypeIgnoreCase(String roleType);
}
