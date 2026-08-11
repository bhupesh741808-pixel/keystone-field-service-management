package com.keystone.fsm.service;

import com.keystone.fsm.dto.PartDTO;
import com.keystone.fsm.entity.Part;
import com.keystone.fsm.mapper.DtoMapper;
import com.keystone.fsm.repository.PartRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Service
public class PartService {

    private final PartRepository partRepository;

    public PartService(PartRepository partRepository) {
        this.partRepository = partRepository;
    }

    public List<PartDTO> getAllParts() {
        return partRepository.findAll().stream()
                .map(DtoMapper::toPartDTO)
                .collect(Collectors.toList());
    }

    public PartDTO getPartById(Long id) {
        Part part = partRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Part not found with ID: " + id));
        return DtoMapper.toPartDTO(part);
    }

    @Transactional
    public PartDTO createPart(PartDTO dto) {
        if (partRepository.findBySku(dto.getSku()).isPresent()) {
            throw new IllegalArgumentException("SKU is already registered");
        }
        Part part = DtoMapper.toPartEntity(dto);
        part = partRepository.save(part);
        return DtoMapper.toPartDTO(part);
    }

    @Transactional
    public PartDTO updatePart(Long id, PartDTO dto) {
        Part part = partRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Part not found with ID: " + id));

        part.setName(dto.getName());
        part.setSku(dto.getSku());
        part.setPrice(dto.getPrice());
        part.setQuantity(dto.getQuantity());

        part = partRepository.save(part);
        return DtoMapper.toPartDTO(part);
    }

    @Transactional
    public void deletePart(Long id) {
        if (!partRepository.existsById(id)) {
            throw new IllegalArgumentException("Part not found with ID: " + id);
        }
        partRepository.deleteById(id);
    }
}
