package com.keystone.fsm.repository;

import com.keystone.fsm.entity.Purchase;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface PurchaseRepository extends JpaRepository<Purchase, Long> {
    List<Purchase> findByCustomerIdOrderByCreatedAtDesc(Long customerId);
    List<Purchase> findAllByOrderByCreatedAtDesc();
}
