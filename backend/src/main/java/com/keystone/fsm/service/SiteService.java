package com.keystone.fsm.service;

import com.keystone.fsm.dto.SiteDTO;
import com.keystone.fsm.entity.Customer;
import com.keystone.fsm.entity.Site;
import com.keystone.fsm.mapper.DtoMapper;
import com.keystone.fsm.repository.CustomerRepository;
import com.keystone.fsm.repository.SiteRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Service
public class SiteService {

    private final SiteRepository siteRepository;
    private final CustomerRepository customerRepository;

    public SiteService(SiteRepository siteRepository, CustomerRepository customerRepository) {
        this.siteRepository = siteRepository;
        this.customerRepository = customerRepository;
    }

    public List<SiteDTO> getAllSites() {
        return siteRepository.findAll().stream()
                .map(DtoMapper::toSiteDTO)
                .collect(Collectors.toList());
    }

    public List<SiteDTO> getSitesByCustomerId(Long customerId) {
        return siteRepository.findByCustomerId(customerId).stream()
                .map(DtoMapper::toSiteDTO)
                .collect(Collectors.toList());
    }

    public SiteDTO getSiteById(Long id) {
        Site site = siteRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Site not found with ID: " + id));
        return DtoMapper.toSiteDTO(site);
    }

    @Transactional
    public SiteDTO createSite(SiteDTO dto) {
        Customer customer = customerRepository.findById(dto.getCustomerId())
                .orElseThrow(() -> new IllegalArgumentException("Customer not found with ID: " + dto.getCustomerId()));
        Site site = DtoMapper.toSiteEntity(dto, customer);
        site = siteRepository.save(site);
        return DtoMapper.toSiteDTO(site);
    }

    @Transactional
    public SiteDTO updateSite(Long id, SiteDTO dto) {
        Site site = siteRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Site not found with ID: " + id));
        Customer customer = customerRepository.findById(dto.getCustomerId())
                .orElseThrow(() -> new IllegalArgumentException("Customer not found with ID: " + dto.getCustomerId()));

        site.setCustomer(customer);
        site.setSiteName(dto.getSiteName());
        site.setAddress(dto.getAddress());
        site.setCity(dto.getCity());
        site.setState(dto.getState());
        site.setPincode(dto.getPincode());

        site = siteRepository.save(site);
        return DtoMapper.toSiteDTO(site);
    }

    @Transactional
    public void deleteSite(Long id) {
        if (!siteRepository.existsById(id)) {
            throw new IllegalArgumentException("Site not found with ID: " + id);
        }
        siteRepository.deleteById(id);
    }
}
