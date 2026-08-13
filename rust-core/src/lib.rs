pub struct KnowledgeGraph {
    pub node_count: usize,
    pub edge_count: usize,
}

#[no_mangle]
pub extern "C" fn create_knowledge_graph() -> *mut KnowledgeGraph {
    let graph = Box::new(KnowledgeGraph {
        node_count: 0,
        edge_count: 0,
    });
    Box::into_raw(graph)
}

#[no_mangle]
pub extern "C" fn free_knowledge_graph(ptr: *mut KnowledgeGraph) {
    if !ptr.is_null() {
        unsafe {
            let _ = Box::from_raw(ptr);
        }
    }
}
