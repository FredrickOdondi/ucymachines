from graph.workflow import create_graph

try:
    app = create_graph()
    png_bytes = app.get_graph().draw_mermaid_png()

    with open("agent_graph.png", "wb") as f:
        f.write(png_bytes)

    print("Graph image saved to agent_graph.png")
except Exception as e:
    print(f"Error generating graph: {e}")
